import { identifierSafe } from '../index'

test('identifierSafe does nothing to legal identifiers', () => {
	expect(identifierSafe('one')).toBe('one')
	expect(identifierSafe('one_two')).toBe('one_two')
	expect(identifierSafe('One')).toBe('One')
})

test('identifierSafe does nothing to legal identifiers with trailing underscores', () => {
	expect(identifierSafe('one_')).toBe('one_')
})

test('identifierSafe converts illegals to underscores', () => {
	expect(identifierSafe('one!two')).toBe('one_two')
	expect(identifierSafe('one two')).toBe('one_two')
	expect(identifierSafe('one(two')).toBe('one_two')
})

test('identifierSafe strips trailing illegals', () => {
	expect(identifierSafe('one!two!')).toBe('one_two')
	expect(identifierSafe('one two ')).toBe('one_two')
	expect(identifierSafe('one(two)')).toBe('one_two')
})

test('identifierSafe collapses multiple illegals', () => {
	expect(identifierSafe('one!!!!two')).toBe('one_two')
	expect(identifierSafe('one    two')).toBe('one_two')
	expect(identifierSafe('one((((two')).toBe('one_two')
})
