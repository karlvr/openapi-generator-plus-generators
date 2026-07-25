import { CodegenOperation, isCodegenOperation } from '@openapi-generator-plus/types'
import { compareHttpMethods } from '@openapi-generator-plus/generator-common'
import { indent, Skip, SKIP } from '@openapi-generator-plus/template-utils'

const ESCAPE_MAP: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	'\'': '&#x27;',
	'`': '&#x60;',
	'=': '&#x3D;',
}

const ESCAPE_CHARS = /[&<>"'`=]/g

/**
 * Escape `value` for interpolation into HTML text or attribute content. Matches
 * Handlebars' `escapeExpression` exactly (the same character set and entity
 * forms), so it must be applied to every value that the original Handlebars
 * template rendered with a double-stache (`{{expr}}`) interpolation.
 *
 * Do not apply this to a value that is already HTML, such as the result of
 * {@link md} — those were rendered with a triple-stache (`{{{expr}}}`) and are
 * trusted to already be safe markup.
 */
export function e(value: string): string {
	return value.replace(ESCAPE_CHARS, char => ESCAPE_MAP[char])
}

/**
 * Coerce `value` to the string that Handlebars' `escapeExpression` would have
 * produced before escaping it: an empty string for `null`/`undefined`,
 * otherwise the value's own string conversion. Use this before {@link e} when
 * porting a double-stache interpolation whose value isn't already a string
 * (for example a raw JSON example value).
 */
export function stringify(value: unknown): string {
	if (value === null || value === undefined) {
		return ''
	}
	return `${value}`
}

/**
 * Convert `value` to a string usable as an HTML `id` or fragment identifier:
 * any run of characters that isn't a letter, digit, hyphen or underscore
 * becomes a single underscore, and leading/trailing underscores are trimmed.
 */
export function htmlId(value: string | { toString(): string }): string {
	return `${value}`.replace(/[^-a-zA-Z0-9_]+/g, '_').replace(/^_+/, '').replace(/_+$/, '')
}

/**
 * Order in which to display a collection of named items (operation groups,
 * operations, schemas) in the generated documentation. Operations are
 * additionally ordered by HTTP method, and by their full path instead of
 * their name when `navStyle` is `'full-path'`.
 */
export function sorted<T extends { name: string }>(items: readonly T[], navStyle: 'name' | 'full-path'): T[] {
	return [...items].sort((a, b) => compareForDisplay(a, b, navStyle))
}

function compareForDisplay<T extends { name: string }>(a: T, b: T, navStyle: 'name' | 'full-path'): number {
	if (a === b) {
		return 0
	}
	if (isCodegenOperation(a) && isCodegenOperation(b)) {
		const result = compareOperations(a, b, navStyle)
		if (result !== 0) {
			return result
		}
	}
	return a.name && b.name ? a.name.localeCompare(b.name) : 0
}

/**
 * Indent every line of `value` with `prefix`, passing a {@link SKIP} value
 * through unchanged. Use this to apply a nested partial's indentation to the
 * output of a fragment (such as {@link fragProperties}) that may legitimately
 * render nothing.
 */
export function indentBlock(value: string | Skip, prefix: string): string | Skip {
	return typeof value === 'string' ? indent(value, prefix) : SKIP
}

function compareOperations(a: CodegenOperation, b: CodegenOperation, navStyle: 'name' | 'full-path'): number {
	const result = compareHttpMethods(a.httpMethod, b.httpMethod)
	if (result !== 0) {
		return result
	}
	if (navStyle === 'full-path' && a.fullPath && b.fullPath) {
		return a.fullPath.localeCompare(b.fullPath)
	}
	return 0
}
