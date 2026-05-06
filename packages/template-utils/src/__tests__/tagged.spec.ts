import { ts, when, maybe, ifElse, each, indent, join, joinLines, SKIP } from '../tagged'

describe('ts tagged template', () => {
	describe('basic interpolation', () => {
		test('renders plain strings', () => {
			expect(ts`hello`).toBe('hello')
		})

		test('interpolates string values', () => {
			expect(ts`hello ${'world'}`).toBe('hello world')
		})

		test('interpolates numbers and booleans', () => {
			expect(ts`${1} ${true}`).toBe('1 true')
		})
	})

	describe('alone-on-line drop semantics', () => {
		test('drops a line when interpolation is null and alone on its line', () => {
			const value: string | null = null
			expect(ts`one
${value}
three`).toBe('one\nthree')
		})

		test('drops a line when interpolation is undefined and alone on its line', () => {
			const value: string | undefined = undefined
			expect(ts`one
${value}
three`).toBe('one\nthree')
		})

		test('drops a line when interpolation is false and alone on its line', () => {
			expect(ts`one
${false}
three`).toBe('one\nthree')
		})

		test('drops a line when interpolation is SKIP and alone on its line', () => {
			expect(ts`one
${SKIP}
three`).toBe('one\nthree')
		})

		test('preserves blank line for empty-string interpolation alone on line', () => {
			expect(ts`one
${''}
three`).toBe('one\n\nthree')
		})

		test('drops a line including its leading whitespace', () => {
			expect(ts`one
\t${null}
three`).toBe('one\nthree')
		})

		test('React-style ${cond && value} drops the line when cond is false', () => {
			const result = ts`a
\t${false && '"private": true,'}
b`
			expect(result).toBe('a\nb')
		})

		test('React-style ${cond && value} renders when cond is truthy', () => {
			const result = ts`a
\t${true && '"private": true,'}
b`
			expect(result).toBe('a\n\t"private": true,\nb')
		})
	})

	describe('mid-line rendering', () => {
		test('renders null/undefined/false as their string forms mid-line', () => {
			expect(ts`x ${null} y`).toBe('x null y')
			expect(ts`x ${undefined} y`).toBe('x undefined y')
			expect(ts`x ${false} y`).toBe('x false y')
		})

		test('renders SKIP as empty string mid-line', () => {
			expect(ts`x ${SKIP} y`).toBe('x  y')
		})

		test('renders true and 0 as their string forms mid-line', () => {
			expect(ts`x ${true} y`).toBe('x true y')
			expect(ts`x ${0} y`).toBe('x 0 y')
		})

		test('mid-line conditional uses empty-string fallback', () => {
			const cond: boolean = false
			expect(ts`}${cond ? 'shown' : ''}`).toBe('}')
		})
	})

	describe('arrays', () => {
		test('renders an array joined without separator', () => {
			expect(ts`${['a', 'b', 'c']}`).toBe('abc')
		})

		test('drops null/undefined/false/SKIP elements from an array', () => {
			expect(ts`${['a', null, 'b', undefined, 'c', false, 'd', SKIP]}`).toBe('abcd')
		})

		test('drops a line when an array produces no output and is alone on its line', () => {
			expect(ts`one
${[null, undefined, false]}
three`).toBe('one\nthree')
		})

		test('does not drop the line when an empty array is mid-line', () => {
			expect(ts`x ${[]} y`).toBe('x  y')
		})
	})

	describe('multi-line / indentation', () => {
		test('aligns multi-line interpolations to surrounding indent', () => {
			const inner = 'first\nsecond\nthird'
			expect(ts`outer {
\t${inner}
}`).toBe('outer {\n\tfirst\n\tsecond\n\tthird\n}')
		})

		test('does not indent when interpolation is mid-line', () => {
			expect(ts`prefix ${'a\nb'} suffix`).toBe('prefix a\nb suffix')
		})

		test('preserves blank lines inside multi-line interpolations', () => {
			expect(ts`\t${'a\n\nb'}`).toBe('\ta\n\n\tb')
		})

		test('nested ts literals propagate indentation', () => {
			const inner = ts`line1
line2`
			expect(ts`outer {
\t${inner}
}`).toBe('outer {\n\tline1\n\tline2\n}')
		})
	})

	describe('whitespace', () => {
		test('strips trailing whitespace from each line', () => {
			expect(ts`one   ${''}
two\t
three`).toBe('one\ntwo\nthree')
		})

		test('drops a single leading newline so templates can start at the left margin', () => {
			expect(ts`
hello
world`).toBe('hello\nworld')
		})

		test('only the first leading newline is dropped', () => {
			expect(ts`

hello`).toBe('\nhello')
		})

		test('does not drop a trailing newline', () => {
			expect(ts`hello
`).toBe('hello\n')
		})
	})

	describe('helpers', () => {
		test('when() renders or skips based on condition', () => {
			expect(ts`a
${when(true, 'shown')}
${when(false, 'hidden')}
b`).toBe('a\nshown\nb')
		})

		test('when() supports thunks', () => {
			expect(ts`a
${when(true, () => 'computed')}
b`).toBe('a\ncomputed\nb')
		})

		test('maybe() drops empty/null values', () => {
			expect(ts`a
${maybe('present')}
${maybe(null)}
${maybe('')}
b`).toBe('a\npresent\nb')
		})

		test('ifElse() picks between two branches', () => {
			expect(ts`${ifElse(true, 'A', 'B')}`).toBe('A')
			expect(ts`${ifElse(false, 'A', 'B')}`).toBe('B')
		})

		test('each() renders items joined with separator', () => {
			expect(each(['a', 'b', 'c'], (item, _i, _f, isLast) => isLast ? item : `${item}, `)).toBe('a, b, c')
		})

		test('each() skips items that render to SKIP/null', () => {
			expect(each([1, 2, 3, 4], (n) => n % 2 === 0 ? `${n}` : SKIP, ',')).toBe('2,4')
		})

		test('each() returns null when the collection is empty', () => {
			expect(each(null, () => 'x')).toBeNull()
			expect(each(undefined, () => 'x')).toBeNull()
			expect(each([], () => 'x')).toBeNull()
		})

		test('${each(...)} drops the line when alone on a line and empty', () => {
			expect(ts`a
${each([], () => 'x')}
b`).toBe('a\nb')
		})

		test('indent() prefixes every non-empty line', () => {
			expect(indent('a\nb\n\nc', '  ')).toBe('  a\n  b\n\n  c')
		})

		test('joinLines() drops empty lines and joins with separator', () => {
			expect(joinLines('a\n\nb\n  \nc', ', ')).toBe('a, b, c')
		})

		test('join() filters falsy values and joins the rest', () => {
			expect(join(['a', false, 'b', null, 'c', undefined], ',')).toBe('a,b,c')
		})

		test('join() returns null when every item is falsy', () => {
			expect(join([null, false, undefined], ',')).toBeNull()
		})
	})
})
