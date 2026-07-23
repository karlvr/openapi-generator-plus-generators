import { CodegenHeader } from '@openapi-generator-plus/types'
import { isDateTime, isDate, isTime, isObject, isArray, isNumeric, isBoolean } from '@openapi-generator-plus/template-utils'
import { DateApproach } from '@openapi-generator-plus/typescript-generator-common'

/**
 * Render an expression that converts a raw string value into the native type
 * of the given schema, e.g. for parsing response header values.
 * @param header the header whose schema determines the conversion
 * @param value an expression that evaluates to the string value
 * @param dateApproach the generator's date-handling approach
 */
export function stringToSchema(header: CodegenHeader, value: string, dateApproach: DateApproach): string {
	if (isDateTime(header)) {
		return dateApproach === DateApproach.Native ? `new Date(${value})` : value
	}
	if (isDate(header) || isTime(header)) {
		return value
	}
	if (isObject(header) || isArray(header)) {
		/* TODO we need to support explode etc */
		return value
	}
	if (isNumeric(header)) {
		return `Number(${value})`
	}
	if (isBoolean(header)) {
		return `(${value} && ${value}.toLowerCase() === 'true')`
	}
	return value
}
