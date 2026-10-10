import { CodegenArraySchema, CodegenSchema } from '@openapi-generator-plus/types'
import { isDateTime, isDate, isTime, isObject, isArray, isNumeric, isBoolean } from '@openapi-generator-plus/template-utils'
import { DateApproach } from '@openapi-generator-plus/typescript-generator-common'

/**
 * Render an expression that converts a raw string value into the native type
 * of the given schema, e.g. for parsing response header values.
 *
 * An array separates its elements with commas, which may have whitespace around
 * them, as a header list does.
 * @param schema the schema that determines the conversion
 * @param value an expression that evaluates to the string value, which must not be empty
 * @param dateApproach the generator's date-handling approach
 */
export function stringToSchema(schema: CodegenSchema, value: string, dateApproach: DateApproach): string {
	if (isDateTime(schema)) {
		return dateApproach === DateApproach.Native ? `new Date(${value})` : value
	}
	if (isDate(schema) || isTime(schema)) {
		return value
	}
	if (isArray(schema)) {
		const element = stringToSchema((schema as CodegenArraySchema).component.schema, '__element', dateApproach)
		return `(${value} ?? '').trim().split(/\\s*,\\s*/).map(__element => ${element})`
	}
	if (isObject(schema)) {
		/* TODO we need to support explode etc */
		return value
	}
	if (isNumeric(schema)) {
		return `Number(${value})`
	}
	if (isBoolean(schema)) {
		return `(${value} && ${value}.toLowerCase() === 'true')`
	}
	return value
}
