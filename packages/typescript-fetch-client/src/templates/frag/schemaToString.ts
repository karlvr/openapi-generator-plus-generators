import { CodegenSchema, CodegenSchemaUsage } from '@openapi-generator-plus/types'
import { isDateTime, isDate, isTime, isObject, isArray } from '@openapi-generator-plus/template-utils'
import { DateApproach } from '@openapi-generator-plus/typescript-generator-common'

export interface SchemaToStringArgs {
	value: string
	schema: CodegenSchemaUsage | CodegenSchema
	dateApproach: DateApproach
}

/**
 * Render an expression that converts the value at `value` to a string,
 * appropriate for the schema's runtime type.
 */
export function schemaToString({ value, schema, dateApproach }: SchemaToStringArgs): string {
	if (isDateTime(schema)) {
		return dateApproach === DateApproach.Native ? `dateToString(${value})` : `String(${value})`
	}
	if (isDate(schema) || isTime(schema)) {
		return `String(${value})`
	}
	if (isObject(schema) || isArray(schema)) {
		/* The behaviour for nested objects and arrays is undefined, but
		   editor.swagger.io transforms these into JSON. */
		return `JSON.stringify(${value})`
	}
	return `String(${value})`
}
