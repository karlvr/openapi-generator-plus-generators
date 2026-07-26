import { CodegenGenerator, CodegenSchema } from '@openapi-generator-plus/types'
import { CodegenGeneratorContext } from '@openapi-generator-plus/types'

/**
 * Format `value` as a string literal in the generator's target language. The
 * generator produces appropriate quoting and escaping.
 */
export function stringLiteral(context: CodegenGeneratorContext, value: string | number | boolean | null): string {
	if (value !== null && typeof value === 'object') {
		throw new Error(`stringLiteral expects a primitive value, got: ${typeof value}`)
	}
	return String(context.generator().toLiteral(value, context.utils.stringLiteralValueOptions()))
}

/**
 * Quote `value` as a string literal if it is not already a valid identifier in
 * the generator's target language.
 */
export function quoteInvalidIdentifier(context: CodegenGeneratorContext, value: string | number | boolean | null): string {
	if (value !== null && typeof value === 'object') {
		throw new Error(`quoteInvalidIdentifier expects a primitive value, got: ${typeof value}`)
	}
	const generator = context.generator()
	if (typeof value === 'string' && generator.toIdentifier(value) !== value) {
		return String(generator.toLiteral(value, context.utils.stringLiteralValueOptions()))
	}
	return String(value)
}

/**
 * Return the language-specific literal for the "undefined" or default value of
 * the given schema. Used when generating code that needs to represent an
 * absent value for a schema-typed slot.
 */
export function undefinedValueLiteral(context: CodegenGeneratorContext, schema: CodegenSchema): string {
	if (schema.schemaType === undefined || schema.nativeType === undefined) {
		throw new Error('undefinedValueLiteral helper requires a CodegenSchemaInfo argument')
	}
	const defaultValue = context.generator().defaultValue({
		...schema,
		required: false,
	})
	if (defaultValue === null) {
		throw new Error(`undefinedValueLiteral cannot format a literal for type ${schema.schemaType}`)
	}
	return defaultValue.literalValue
}

export { CodegenGenerator }
