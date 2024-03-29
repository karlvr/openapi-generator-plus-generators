import { camelCase, pascalCase } from '../case-transforms'

test('camelCase', () => {
	expect(camelCase('one_two')).toBe('oneTwo')
	expect(camelCase('one__two')).toBe('oneTwo')
	expect(camelCase('FAQSection')).toBe('faqSection')
})

test('camelCase changes case on first word', () => {
	expect(camelCase('FAQ_section')).toBe('faqSection')
	expect(camelCase('FAQ-section')).toBe('faqSection')
	expect(camelCase('FAQSection')).toBe('faqSection')
	expect(camelCase('One_two')).toBe('oneTwo')
})

test('camelCase changes an all upper-case word to all lower-case', () => {
	expect(camelCase('FAQS')).toBe('faqs')
	expect(camelCase('ARRAY2')).toBe('array2')
	expect(camelCase('FAQS_AND_MORE')).toBe('faqsAndMore')
})

test('camelCase preserves case on later words', () => {
	expect(camelCase('get_FAQ_section')).toBe('getFAQSection')
	expect(camelCase('get-FAQ-section')).toBe('getFAQSection')
	expect(camelCase('getFAQSection')).toBe('getFAQSection')
	expect(camelCase('getOne_two')).toBe('getOneTwo')
})

test('pascalCase preserves case', () => {
	expect(pascalCase('FAQ_section')).toBe('FAQSection')
	expect(pascalCase('FAQ-section')).toBe('FAQSection')
	expect(pascalCase('FAQSection')).toBe('FAQSection')
	expect(pascalCase('One_two')).toBe('OneTwo')
})

test('camelCase works on SNAKE_CASE', () => {
	expect(camelCase('HE_HIM_HIS')).toBe('heHimHis')
	expect(camelCase('he_him_his')).toBe('heHimHis')
	expect(camelCase('HE_him_his')).toBe('heHimHis')
	expect(camelCase('HE_him_HIS')).toBe('heHimHIS')
	expect(camelCase('he_HIM_HIS')).toBe('heHIMHIS')
})
