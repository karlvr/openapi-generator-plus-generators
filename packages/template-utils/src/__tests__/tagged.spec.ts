import { ts, when, maybe, ifElse, each, indent, join, joinLines, SKIP, TsValue } from '../tagged'

describe('ts tagged template', () => {
	describe('basic interpolation', () => {
		test('renders plain strings', () => {
			expect(ts`hello`).toBe('hello')
		})

		test('interpolates string values', () => {
			expect(ts`hello ${'world'}`).toBe('hello world')
		})

		test('renders Stringable values via toString', () => {
			class Foo {
				toString() { return 'foo!' }
			}
			expect(ts`a ${new Foo()} b`).toBe('a foo! b')
		})
	})

	describe('SKIP', () => {
		test('drops the line when SKIP is alone on its line', () => {
			expect(ts`one
${SKIP}
three`).toBe('one\nthree')
		})

		test('drops the line including its leading whitespace', () => {
			expect(ts`one
\t${SKIP}
three`).toBe('one\nthree')
		})

		test('renders SKIP as empty string mid-line', () => {
			expect(ts`x ${SKIP} y`).toBe('x  y')
		})

		test('does NOT drop the line for empty string alone-on-line', () => {
			expect(ts`one
${''}
three`).toBe('one\n\nthree')
		})

		test('${cond ? value : SKIP} drops the line when cond is false', () => {
			const cond = false
			expect(ts`a
\t${cond ? 'shown' : SKIP}
b`).toBe('a\nb')
		})
	})

	describe('rejects invalid interpolation values at runtime', () => {
		test('throws on null', () => {
			expect(() => ts`${null as unknown as TsValue}`).toThrow(/null/)
		})
		test('throws on undefined', () => {
			expect(() => ts`${undefined as unknown as TsValue}`).toThrow(/undefined/)
		})
		test('throws on boolean', () => {
			expect(() => ts`${false as unknown as TsValue}`).toThrow(/boolean/)
			expect(() => ts`${true as unknown as TsValue}`).toThrow(/boolean/)
		})
		test('throws on number', () => {
			expect(() => ts`${1 as unknown as TsValue}`).toThrow(/number/)
		})
		test('throws on array', () => {
			expect(() => ts`${[1, 2] as unknown as TsValue}`).toThrow(/array/)
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
		test('when() returns the value when condition truthy', () => {
			expect(ts`a
${when(true, 'shown')}
b`).toBe('a\nshown\nb')
		})

		test('when() returns SKIP and drops the line when condition falsy', () => {
			expect(ts`a
${when(false, 'hidden')}
b`).toBe('a\nb')
		})

		test('when() supports thunks', () => {
			expect(ts`a
${when(true, () => 'computed')}
b`).toBe('a\ncomputed\nb')
		})

		test('maybe() returns the value when non-empty, else SKIP', () => {
			expect(ts`a
${maybe('present')}
${maybe(null)}
${maybe('')}
b`).toBe('a\npresent\nb')
		})

		test('maybe(value, fn) calls fn when non-empty, else SKIP', () => {
			expect(ts`a
${maybe('x', v => `got ${v}`)}
${maybe(null, () => 'ignored')}
${maybe('', () => 'ignored')}
b`).toBe('a\ngot x\nb')
		})

		test('ifElse() picks between two branches', () => {
			expect(ts`${ifElse(true, 'A', 'B')}`).toBe('A')
			expect(ts`${ifElse(false, 'A', 'B')}`).toBe('B')
		})

		test('each() renders items joined with separator', () => {
			expect(each(['a', 'b', 'c'], (item, _i, _f, isLast) => isLast ? item : `${item}, `)).toBe('a, b, c')
		})

		test('each() skips items that return SKIP', () => {
			expect(each([1, 2, 3, 4], n => n % 2 === 0 ? `${n}` : SKIP, ',')).toBe('2,4')
		})

		test('each() returns SKIP for empty / all-skipped collections', () => {
			expect(each(null, () => 'x')).toBe(SKIP)
			expect(each(undefined, () => 'x')).toBe(SKIP)
			expect(each([], () => 'x')).toBe(SKIP)
			expect(each([1, 2, 3], () => SKIP)).toBe(SKIP)
		})

		test('${each(...)} drops the line when alone on a line and empty', () => {
			expect(ts`a
${each([], () => 'x')}
b`).toBe('a\nb')
		})

		test('${each(...)} renders empty mid-line when empty', () => {
			expect(ts`x ${each([], () => 'x')} y`).toBe('x  y')
		})

		test('join() filters SKIP and empty strings, joins the rest', () => {
			expect(join(['a', SKIP, 'b', '', 'c'], ',')).toBe('a,b,c')
		})

		test('join() returns SKIP when all items are SKIP/empty', () => {
			expect(join([SKIP, SKIP], ',')).toBe(SKIP)
			expect(join([], ',')).toBe(SKIP)
		})

		test('indent() prefixes every non-empty line', () => {
			expect(indent('a\nb\n\nc', '  ')).toBe('  a\n  b\n\n  c')
		})

		test('joinLines() drops empty lines and joins with separator', () => {
			expect(joinLines('a\n\nb\n  \nc', ', ')).toBe('a, b, c')
		})
	})
})
