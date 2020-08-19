import { CodegenGenerator, CodegenState, CodegenSchemaType, CodegenConfig } from '@openapi-generator-plus/types'
import { pascalCase, camelCase } from '@openapi-generator-plus/generator-common'
import { constantCase } from 'change-case'
import { commonGenerator } from '@openapi-generator-plus/generator-common'

/** Returns the string converted to a string that is safe as an identifier in java-like languages */
function identifierSafe(value: string) {
	if (typeof value !== 'string') {
		throw new Error(`identifierSafe called with non-string: ${typeof value} (${value})`)
	}

	/* Add a prefix if the identifier starts with illegal characters */
	if (value.match(/^[^a-zA-Z_]/)) {
		value = `_${value}`
	}

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
	return identifierSafe(pascalCase(identifierSafe(value)))
}

export function identifierCamelCase(value: string) {
	return identifierSafe(camelCase(identifierSafe(value)))
}

export const enum ConstantStyle {
	allCapsSnake = 'snake',
	allCaps = 'allCaps',
	camelCase = 'camelCase',
	pascalCase = 'pascalCase',
}

export interface JavaLikeOptions {
	modelClassPrefix?: string
	constantStyle: ConstantStyle
}

export function options<O extends JavaLikeOptions>(config: CodegenConfig, context: JavaLikeContext<O>): JavaLikeOptions {
	const result: JavaLikeOptions = {
		constantStyle: config.constantStyle || context.defaultConstantStyle,
	}
	return result
}

export interface JavaLikeContext<O extends JavaLikeOptions> {
	reservedWords?: (state: CodegenState<O>) => string[]
	defaultConstantStyle: ConstantStyle
}

export function javaLikeGenerator<O extends JavaLikeOptions>(context: JavaLikeContext<O>): Pick<CodegenGenerator<O>, 'toClassName' | 'toIdentifier' | 'toConstantName' | 'toSchemaName' | 'toOperationGroupName'> {
	const cg = commonGenerator<O>()
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
		toConstantName: (name, state) => {
			const constantStyle = state.options.constantStyle
			switch (constantStyle) {
				case ConstantStyle.allCaps:
					return identifierSafe(constantCase(identifierSafe(name)).replace(/_/g, ''))
				case ConstantStyle.camelCase:
					return identifierCamelCase(name)
				case ConstantStyle.allCapsSnake:
					return identifierSafe(constantCase(identifierSafe(name)))
				case ConstantStyle.pascalCase:
					return identifierSafe(pascalCase(identifierSafe(name)))
				default:
					throw new Error(`Invalid valid for constantStyle: ${constantStyle}`)
			}
		},
		toSchemaName: (name, options, state) => {
			if (!options.nameSpecified && options.schemaType === CodegenSchemaType.ENUM) {
				name = `${name}_enum`
			}
			let result = cg.toSchemaName(name, options, state)
			if (options.schemaType === CodegenSchemaType.OBJECT && state.options.modelClassPrefix) {
				result = state.options.modelClassPrefix + result
			}
			return result
		},
		toOperationGroupName: (name, state) => {
			return state.generator.toClassName(name, state)
		},
	}
}
