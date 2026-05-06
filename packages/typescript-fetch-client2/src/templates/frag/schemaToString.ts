import { CodegenSchema, CodegenSchemaUsage, CodegenSchemaType } from '@openapi-generator-plus/types'
import { isDateTime, isDate, isTime, isObject, isArray } from '@openapi-generator-plus/template-utils'

export interface SchemaToStringArgs {
	value: string
	schema: CodegenSchemaUsage | CodegenSchema
	dateApproach: string
	indent: string
}

/**
 * Render an expression that converts the value at `value` to a string,
 * appropriate for the schema's runtime type.
 */
export function schemaToString({ value, schema, dateApproach }: SchemaToStringArgs): string {
	if (isDateTime(asContainer(schema))) {
		return dateApproach === 'native' ? `dateToString(${value})` : `String(${value})`
	}
	if (isDate(asContainer(schema)) || isTime(asContainer(schema))) {
		return `String(${value})`
	}
	if (isObject(asContainer(schema)) || isArray(asContainer(schema))) {
		/* The behaviour for nested objects and arrays is undefined, but
		   editor.swagger.io transforms these into JSON. */
		return `JSON.stringify(${value})`
	}
	return `String(${value})`
}

function asContainer(schema: CodegenSchemaUsage | CodegenSchema): { schemaType?: CodegenSchemaType; schema?: { schemaType?: CodegenSchemaType } } {
	return schema as { schemaType?: CodegenSchemaType; schema?: { schemaType?: CodegenSchemaType } }
}
