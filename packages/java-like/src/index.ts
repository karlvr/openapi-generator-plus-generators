import { CodegenGenerator, CodegenSchemaType, CodegenConfig, CodegenGeneratorContext, CodegenSchemaPurpose } from '@openapi-generator-plus/types'
import { pascalCase, camelCase } from '@openapi-generator-plus/generator-common'
import { constantCase } from 'change-case'
import { commonGenerator } from '@openapi-generator-plus/generator-common'

/** Returns the string converted to a string that is safe as an identifier in java-like languages */
export function identifierSafe(value: string): string {
	if (typeof value !== 'string') {
		throw new Error(`identifierSafe called with non-string: ${typeof value} (${value})`)
	}

	/* Add a prefix if the identifier starts with illegal characters */
	if (value.match(/^[^a-zA-Z_]/)) {
		value = `_${value}`
	}

	/* Convert any illegal characters to underscores, as long as they're followed by legal characters */
	value = value.replace(/[^a-zA-Z0-9_]([a-zA-Z0-9_])/g, '_$1')

	/* Remove any remaining illegal characters */
	value = value.replace(/[^a-zA-Z0-9_]/g, '')

	return value
}

/**
 * Camel case and capitalize suitable for a class name. Doesn't change existing
 * capitalization in the value.
 * e.g. "FAQSection" remains "FAQSection", and "faqSection" will become "FaqSection" 
 * @param value string to be turned into a class name
 */
export function classCamelCase(value: string): string {
	return identifierSafe(pascalCase(identifierSafe(value)))
}

export function identifierCamelCase(value: string): string {
	return identifierSafe(camelCase(identifierSafe(value)))
}

export const enum ConstantStyle {
	allCapsSnake = 'snake',
	allCaps = 'allCaps',
	camelCase = 'camelCase',
	pascalCase = 'pascalCase',
}

export interface JavaLikeOptions {
	apiClassPrefix?: string
	modelClassPrefix?: string
	constantStyle: ConstantStyle
}

export function options(config: CodegenConfig, context: JavaLikeContext): JavaLikeOptions {
	const result: JavaLikeOptions = {
		apiClassPrefix: config.apiClassPrefix,
		modelClassPrefix: config.modelClassPrefix,
		constantStyle: config.constantStyle || context.defaultConstantStyle,
	}
	return result
}

export interface JavaLikeContext extends CodegenGeneratorContext {
	reservedWords?: () => string[]
	defaultConstantStyle: ConstantStyle
}

export function javaLikeGenerator(config: CodegenConfig, context: JavaLikeContext): Pick<CodegenGenerator, 'toClassName' | 'toIdentifier' | 'toConstantName' | 'toSchemaName' | 'toSuggestedSchemaName' | 'toOperationGroupName'> {
	const generatorOptions = options(config, context)

	const cg = commonGenerator(config, context)
	return {
		toClassName: (name) => {
			let result = classCamelCase(name)
			const reservedWords = context.reservedWords ? context.reservedWords() : []
			while (reservedWords.indexOf(result) !== -1) {
				result = classCamelCase(`a_${name}`)
			}
			return result
		},
		toIdentifier: (name) => {
			let result = identifierCamelCase(name)
			const reservedWords = context.reservedWords ? context.reservedWords() : []
			while (reservedWords.indexOf(result) !== -1) {
				result = identifierCamelCase(`a_${name}`)
			}
			return result
		},
		toConstantName: (name) => {
			if (!name) {
				return context.generator().toConstantName('empty')
			}

			const constantStyle = generatorOptions.constantStyle
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
		toSchemaName: (name, options) => {
			let result = cg.toSchemaName(name, options)
			result = context.generator().toClassName(result)
			if ((options.schemaType === CodegenSchemaType.OBJECT || options.schemaType === CodegenSchemaType.INTERFACE || options.schemaType === CodegenSchemaType.WRAPPER || options.schemaType === CodegenSchemaType.ALLOF || options.schemaType === CodegenSchemaType.ANYOF || options.schemaType === CodegenSchemaType.ONEOF || options.schemaType === CodegenSchemaType.ENUM) && generatorOptions.modelClassPrefix) {
				result = generatorOptions.modelClassPrefix + result
			}
			return result
		},
		toSuggestedSchemaName: (name, options) => {
			if (options.schemaType === CodegenSchemaType.ENUM) {
				name = `${name}_enum`
			} else if (options.purpose === CodegenSchemaPurpose.EXTRACTED_INTERFACE) {
				name = `i_${name}`
			} else if (options.purpose === CodegenSchemaPurpose.IMPLEMENTATION) {
				name = `abstract_${name}`
			}
			return cg.toSuggestedSchemaName(name, options)
		},
		toOperationGroupName: (name) => {
			if (generatorOptions.apiClassPrefix) {
				return context.generator().toClassName(`${generatorOptions.apiClassPrefix}_${name}`)
			} else {
				return context.generator().toClassName(name)
			}
		},
	}
}
