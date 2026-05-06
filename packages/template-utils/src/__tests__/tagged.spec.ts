import { ts, when, maybe, ifElse, each, indent, joinLines, SKIP } from '../tagged'

describe('ts tagged template', () => {
	test('renders plain strings', () => {
		expect(ts`hello`).toBe('hello')
	})

	test('interpolates string values', () => {
		expect(ts`hello ${'world'}`).toBe('hello world')
	})

	test('interpolates number and boolean values', () => {
		expect(ts`${1} ${true} ${false}`).toBe('1 true false')
	})

	test('drops a line when interpolation is null', () => {
		const value: string | null = null
		const result = ts`one
two ${value} two
three`
		expect(result).toBe('one\nthree')
	})

	test('drops a line when interpolation is undefined', () => {
		const value: string | undefined = undefined
		const result = ts`one
${value}
three`
		expect(result).toBe('one\nthree')
	})

	test('drops a line when interpolation is SKIP', () => {
		const result = ts`one
${SKIP}
three`
		expect(result).toBe('one\nthree')
	})

	test('does not drop a line when value is empty string', () => {
		const result = ts`one
${''}
three`
		expect(result).toBe('one\n\nthree')
	})

	test('renders arrays joined without separator', () => {
		expect(ts`${['a', 'b', 'c']}`).toBe('abc')
	})

	test('drops SKIPs from inside arrays', () => {
		expect(ts`${['a', null, 'b', SKIP, 'c']}`).toBe('abc')
	})

	test('drops a line when an array renders to empty', () => {
		const result = ts`one
${[null, undefined]}
three`
		expect(result).toBe('one\nthree')
	})

	test('strips trailing whitespace from each line', () => {
		const result = ts`one   ${''}
two\t
three`
		/* The first line ends with the empty interpolation, then trailing space is trimmed. */
		expect(result).toBe('one\ntwo\nthree')
	})

	test('aligns multi-line interpolations to surrounding indent', () => {
		const inner = 'first\nsecond\nthird'
		const result = ts`outer {
	${inner}
}`
		expect(result).toBe('outer {\n\tfirst\n\tsecond\n\tthird\n}')
	})

	test('does not indent leading line of multi-line interpolation', () => {
		const inner = 'a\nb'
		const result = ts`prefix
${inner}
suffix`
		expect(result).toBe('prefix\na\nb\nsuffix')
	})

	test('preserves blank lines inside multi-line interpolations', () => {
		const inner = 'a\n\nb'
		const result = ts`	${inner}`
		expect(result).toBe('\ta\n\n\tb')
	})

	test('when() renders or skips based on condition', () => {
		const out = ts`a
${when(true, 'shown')}
${when(false, 'hidden')}
b`
		expect(out).toBe('a\nshown\nb')
	})

	test('when() supports thunks', () => {
		const out = ts`a
${when(true, () => 'computed')}
b`
		expect(out).toBe('a\ncomputed\nb')
	})

	test('maybe() drops empty/null values', () => {
		const out = ts`a
${maybe('present')}
${maybe(null)}
${maybe('')}
b`
		expect(out).toBe('a\npresent\nb')
	})

	test('ifElse() picks between two branches', () => {
		expect(ts`${ifElse(true, 'A', 'B')}`).toBe('A')
		expect(ts`${ifElse(false, 'A', 'B')}`).toBe('B')
	})

	test('each() renders items joined with separator', () => {
		const out = each(['a', 'b', 'c'], (item, _i, _f, isLast) => isLast ? item : `${item}, `)
		expect(out).toBe('a, b, c')
	})

	test('each() skips items that render to SKIP/null', () => {
		const out = each([1, 2, 3, 4], (n) => n % 2 === 0 ? `${n}` : SKIP, ',')
		expect(out).toBe('2,4')
	})

	test('each() handles null/undefined iterable', () => {
		expect(each(null, () => 'x')).toBe('')
		expect(each(undefined, () => 'x')).toBe('')
	})

	test('indent() prefixes every non-empty line', () => {
		expect(indent('a\nb\n\nc', '  ')).toBe('  a\n  b\n\n  c')
	})

	test('joinLines() drops empty lines and joins with separator', () => {
		expect(joinLines('a\n\nb\n  \nc', ', ')).toBe('a, b, c')
	})
})
