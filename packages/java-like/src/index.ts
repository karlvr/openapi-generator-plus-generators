import { CodegenGenerator, CodegenState } from '@openapi-generator-plus/types'
import { pascalCase, camelCase } from '@openapi-generator-plus/generator-common'
import { constantCase } from 'change-case'

/** Returns the string converted to a string that is safe as an identifier in java-like languages */
function identifierSafe(value: string) {
	/* Remove invalid leading characters */
	value = value.replace(/^[^a-zA-Z_]*/, '')

	/* Convert any illegal characters to underscores */
	value = value.replace(/[^a-zA-Z0-9_]/g, '_')

	return value
}

/**
 * Camel case and capitalize suitable for a class name. Doesn't change existing
 * capitalization in the value.
 * e.g. "FAQSection" remains "FAQSection", and "faqSection" will become "FaqSection" 
 * @param value string to be turned into a class name
 */
export function classCamelCase(value: string) {
	return pascalCase(identifierSafe(value))
}

export function identifierCamelCase(value: string) {
	return camelCase(identifierSafe(value))
}

export interface JavaLikeContext<O> {
	reservedWords?: (state: CodegenState<O>) => string[]
}

export function javaLikeGenerator<O>(context: JavaLikeContext<O>): Pick<CodegenGenerator<O>, 'toClassName' | 'toIdentifier' | 'toConstantName' | 'toEnumName'> {
	return {
		toClassName: (name) => {
			return classCamelCase(name)
		},
		toIdentifier: (name, state) => {
			let result = identifierCamelCase(name)
			const reservedWords = context.reservedWords ? context.reservedWords(state) : []
			while (reservedWords.indexOf(result) !== -1) {
				result = identifierCamelCase(`a_${name}`)
			}
			return result
		},
		toConstantName: (name) => {
			return constantCase(name)
		},
		toEnumName: (name, options, state) => {
			return state.generator.toModelName(`${name}_enum`, options, state)
		},
	}
}
