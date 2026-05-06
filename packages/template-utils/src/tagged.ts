/**
 * Sentinel value indicating "render nothing here, and if you're alone on a
 * line, drop the line entirely". `SKIP` is the only way to drop a line.
 *
 * Helpers that may produce no output (`when`, `each`, `join`, `maybe`) return
 * `string | Skip` so the caller's type system sees the SKIP case
 * explicitly.
 *
 * SKIP is a frozen sentinel object (rather than a `unique symbol`) so that
 * TypeScript doesn't flag every interpolation with a possibly-SKIP value as
 * an "implicit symbol-to-string conversion". If SKIP ever leaks into a plain
 * JS template literal, its `toString` returns the empty string — defensive.
 */
export type Skip = { readonly __isSkip: true; toString(): string }
const SKIP_INTERNAL = Object.freeze({
	__isSkip: true as const,
	toString: () => '',
})
export const SKIP: Skip = SKIP_INTERNAL

/** Identity-check predicate; works as a TS narrowing guard. */
function isSkip(value: unknown): value is Skip {
	return value === SKIP
}

/**
 * An object that knows how to convert itself to a string. CodegenNativeType
 * and similar generator types satisfy this. Plain objects technically match
 * structurally; in practice you only interpolate types you've intended to
 * stringify.
 */
export type Stringable = object & { toString(): string }

/**
 * The set of values the {@link ts} tagged template will accept as
 * interpolations. Anything else (`null`, `undefined`, `false`, `true`,
 * numbers, arrays) is a compile-time and run-time error — the developer is
 * forced to convert at the call site:
 *
 * - `string | null` → `value ?? ''` (render as empty) or `value ?? SKIP` (drop the line)
 * - `boolean` → `cond ? 'yes' : 'no'`
 * - `number` → `String(n)`
 * - array → `each(items, …)` or `arr.join('')`
 *
 * This makes intent explicit at every interpolation site and surfaces forgotten
 * conversions as type errors rather than silent stringification.
 */
export type TsValue = string | Skip | Stringable

/**
 * Tagged template for emitting source code.
 *
 * Whitespace handling rules:
 *
 * - **Alone on a line:** if an interpolation sits on its own line (only
 *   whitespace before it, and only whitespace + newline or end-of-template
 *   after it) and the value is `SKIP`, the entire line is removed. This is
 *   the only way to drop a line and matches Handlebars' standalone-block rule.
 * - **Empty string** is just empty content — alone-on-line, it leaves a blank
 *   line (no special drop). To drop, use `SKIP`.
 * - **Mid-line:** `SKIP` renders as the empty string; strings and stringables
 *   render as their content.
 * - **Multi-line values** alone on their line are indented to match the column
 *   at which the interpolation appears, so nested `ts` literals compose
 *   naturally.
 * - **Trailing whitespace** on each line is trimmed.
 * - A single **leading newline** at the very start of the rendered template is
 *   dropped, so a template can begin on a fresh line for readability without
 *   producing a blank first line in the output.
 */
export function ts(strings: TemplateStringsArray, ...values: TsValue[]): string {
	let result = ''
	for (let i = 0; i < strings.length; i++) {
		result += strings[i]
		if (i < values.length) {
			const nextString = strings[i + 1] ?? ''
			const aloneOnLine = isAloneOnLine(result, nextString)
			const rendered = renderValue(values[i], aloneOnLine)
			if (isSkip(rendered)) {
				result = markLineForRemoval(result)
				/* The trailing whitespace + newline of the literal that follows
				 * is part of the line we're removing. */
				result += SKIP_MARKER
			} else {
				result += alignIndentation(result, rendered)
			}
		}
	}
	return finalise(result)
}

const SKIP_MARKER = '\x00SKIP\x00'

/**
 * Render a {@link TsValue} into a string, or return {@link SKIP} when the
 * value is SKIP and we're alone on a line. Throws on other types — `null`,
 * `undefined`, `false`, `true`, numbers, arrays — to surface forgotten
 * conversions at the call site.
 */
export function renderValue(value: TsValue, aloneOnLine: boolean): string | Skip {
	if (isSkip(value)) {
		return aloneOnLine ? SKIP : ''
	}
	if (typeof value === 'string') {
		return value
	}
	rejectInvalidValue(value)
	if (typeof (value as Stringable).toString === 'function') {
		return (value as Stringable).toString()
	}
	throw new TypeError(`ts: unsupported interpolation value of type ${typeof value}`)
}

function rejectInvalidValue(value: unknown): void {
	if (value === null) {
		throw new TypeError("ts: `null` is not a valid interpolation; use `''` to render empty or `SKIP` to drop the line")
	}
	if (value === undefined) {
		throw new TypeError("ts: `undefined` is not a valid interpolation; use `value ?? ''` or `value ?? SKIP`")
	}
	if (typeof value === 'boolean') {
		throw new TypeError(`ts: boolean (${value}) is not a valid interpolation; use a ternary or \`when()\``)
	}
	if (typeof value === 'number') {
		throw new TypeError(`ts: number (${value}) is not a valid interpolation; use \`String(${value})\``)
	}
	if (Array.isArray(value)) {
		throw new TypeError("ts: array is not a valid interpolation; use `each(items, …)` or `arr.join('')`")
	}
}

/**
 * Whether the interpolation site (between `precedingResult` and `nextString`)
 * is the only non-whitespace content on its line: only whitespace precedes it
 * since the last newline, and the next literal segment begins with optional
 * whitespace then a newline (or is the end of the template).
 */
function isAloneOnLine(precedingResult: string, nextString: string): boolean {
	const lastNewline = precedingResult.lastIndexOf('\n')
	const currentLine = lastNewline === -1 ? precedingResult : precedingResult.substring(lastNewline + 1)
	if (!/^[\t ]*$/.test(currentLine)) {
		return false
	}
	if (nextString.length === 0) {
		return true
	}
	return /^[\t ]*(\r?\n|$)/.test(nextString)
}

function markLineForRemoval(result: string): string {
	const lastNewline = result.lastIndexOf('\n')
	if (lastNewline === -1) {
		return SKIP_MARKER + result
	}
	return result.substring(0, lastNewline + 1) + SKIP_MARKER + result.substring(lastNewline + 1)
}

/**
 * If `value` is multi-line and the interpolation appears alone on its line,
 * indent every line after the first to match the column at which the
 * interpolation appears.
 */
function alignIndentation(precedingResult: string, value: string): string {
	if (!value.includes('\n')) {
		return value
	}
	const lastNewline = precedingResult.lastIndexOf('\n')
	const currentLine = lastNewline === -1 ? precedingResult : precedingResult.substring(lastNewline + 1)
	const indentMatch = currentLine.match(/^[\t ]*/)
	const indent = indentMatch ? indentMatch[0] : ''
	if (indent.length === 0) {
		return value
	}
	if (currentLine.length !== indent.length) {
		return value
	}
	const lines = value.split('\n')
	for (let i = 1; i < lines.length; i++) {
		if (lines[i].length > 0) {
			lines[i] = indent + lines[i]
		}
	}
	return lines.join('\n')
}

function finalise(result: string): string {
	const lines = result.split('\n')
	const out: string[] = []
	for (const line of lines) {
		if (line.includes(SKIP_MARKER)) {
			continue
		}
		out.push(line.replace(/[\t ]+$/, ''))
	}
	let joined = out.join('\n')
	if (joined.startsWith('\n')) {
		joined = joined.slice(1)
	}
	return joined
}

/**
 * Render `value` if `condition` is truthy, else return SKIP (so the line drops
 * when used alone-on-line). `value` may be a string or a thunk; using a thunk
 * is useful when the value is itself a `ts` template you don't want to
 * evaluate when the condition is false.
 */
export function when(condition: unknown, value: string | (() => string)): string | Skip {
	if (!condition) {
		return SKIP
	}
	return typeof value === 'function' ? value() : value
}

/**
 * Return `value` if it's a non-empty string, else SKIP.
 */
export function maybe(value: string | null | undefined): string | Skip {
	if (value === null || value === undefined || value === '') {
		return SKIP
	}
	return value
}

/**
 * Render `value` if `condition` is truthy, else `otherwise`. Just a clearer
 * spelling of the ternary expression.
 */
export function ifElse(condition: unknown, value: string, otherwise: string): string {
	return condition ? value : otherwise
}

/**
 * Filter SKIPs from `items` and join the rest with `separator`. Returns SKIP
 * when every item was SKIP (or the list was empty), so `${join(items, sep)}`
 * alone on a line drops the line.
 */
export function join(items: (string | Skip)[], separator: string): string | Skip {
	const parts: string[] = []
	for (const item of items) {
		if (isSkip(item) || item === '') {
			continue
		}
		parts.push(item)
	}
	if (parts.length === 0) {
		return SKIP
	}
	return parts.join(separator)
}

/**
 * Render the items in `collection` by calling `render` for each, joining with
 * `separator`. Items that return SKIP are dropped before the join.
 *
 * Returns SKIP when the collection is empty (or every item rendered to SKIP)
 * so that `${each(items, …)}` alone on a line drops the line.
 */
export function each<T>(
	collection: Iterable<T> | Record<string, T> | null | undefined,
	render: (item: T, index: number, isFirst: boolean, isLast: boolean) => string | Skip,
	separator = '',
): string | Skip {
	if (!collection) {
		return SKIP
	}
	let items: T[]
	if (Array.isArray(collection)) {
		items = collection
	} else if (typeof (collection as Iterable<T>)[Symbol.iterator] === 'function') {
		items = Array.from(collection as Iterable<T>)
	} else {
		items = Object.values(collection as Record<string, T>)
	}
	const parts: string[] = []
	for (let i = 0; i < items.length; i++) {
		const rendered = render(items[i], i, i === 0, i === items.length - 1)
		if (isSkip(rendered) || rendered === '') {
			continue
		}
		parts.push(rendered)
	}
	if (parts.length === 0) {
		return SKIP
	}
	return parts.join(separator)
}

/**
 * Indent every non-empty line of `value` with `prefix`.
 */
export function indent(value: string, prefix: string): string {
	return value.split(/\r?\n/).map(line => line.length === 0 ? line : prefix + line).join('\n')
}

/**
 * Join the non-empty lines of `value` with `separator`. Useful for replicating
 * the `{{#join}}` Handlebars helper.
 */
export function joinLines(value: string, separator: string): string {
	return value.split(/\r?\n/).filter(line => line.trim().length > 0).join(separator)
}
