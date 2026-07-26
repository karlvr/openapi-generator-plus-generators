import {
	CodegenSchema,
	CodegenSchemaUsage,
	CodegenSchemaType,
	CodegenContent,
	CodegenParameter,
	CodegenProperty,
	isCodegenParameter,
	isCodegenProperty,
} from '@openapi-generator-plus/types'

/**
 * The argument shape accepted by the schema-type predicates. We accept either a
 * bare schema, or a schema usage (which has its `schemaType` on a nested `schema`),
 * or any object that already has a `schemaType` (CodegenContent, CodegenRequestBody,
 * CodegenParameter, etc.).
 */
type SchemaTypeContainer = { schemaType?: CodegenSchemaType; schema?: { schemaType?: CodegenSchemaType } }

function readSchemaType(target: SchemaTypeContainer): CodegenSchemaType {
	if (target.schemaType !== undefined) {
		return target.schemaType
	}
	if (target.schema && target.schema.schemaType !== undefined) {
		return target.schema.schemaType
	}
	throw new Error('Schema-type predicate called with a value that has no schemaType')
}

function makePredicate(...types: CodegenSchemaType[]): (target: SchemaTypeContainer) => boolean {
	if (types.length === 1) {
		const expected = types[0]
		return (target) => readSchemaType(target) === expected
	}
	return (target) => types.includes(readSchemaType(target))
}

export const isObject = makePredicate(CodegenSchemaType.OBJECT)
export const isAllOf = makePredicate(CodegenSchemaType.ALLOF)
export const isAnyOf = makePredicate(CodegenSchemaType.ANYOF)
export const isOneOf = makePredicate(CodegenSchemaType.ONEOF)
export const isHierarchy = makePredicate(CodegenSchemaType.HIERARCHY)
export const isInterface = makePredicate(CodegenSchemaType.INTERFACE)
export const isWrapper = makePredicate(CodegenSchemaType.WRAPPER)
export const isMap = makePredicate(CodegenSchemaType.MAP)
export const isArray = makePredicate(CodegenSchemaType.ARRAY)
export const isBoolean = makePredicate(CodegenSchemaType.BOOLEAN)
export const isNumeric = makePredicate(CodegenSchemaType.NUMBER, CodegenSchemaType.INTEGER)
export const isNumber = makePredicate(CodegenSchemaType.NUMBER)
export const isInteger = makePredicate(CodegenSchemaType.INTEGER)
export const isEnum = makePredicate(CodegenSchemaType.ENUM)
export const isString = makePredicate(CodegenSchemaType.STRING)
export const isDateTime = makePredicate(CodegenSchemaType.DATETIME)
export const isDate = makePredicate(CodegenSchemaType.DATE)
export const isTime = makePredicate(CodegenSchemaType.TIME)
export const isBinary = makePredicate(CodegenSchemaType.BINARY)
export const isFile = makePredicate(CodegenSchemaType.FILE)
export const isAny = makePredicate(CodegenSchemaType.ANY)

/** Whether the content's media type is a JSON variant. */
export function isContentJson(content: CodegenContent): boolean {
	return !!content && /\bjson$/.test(content.mediaType.mimeType)
}

/** Whether the content is a multipart media type. */
export function isContentMultipart(content: CodegenContent): boolean {
	return !!content && /^multipart\//.test(content.mediaType.mimeType)
}

/** Whether the content is form-url-encoded. */
export function isContentFormUrlEncoded(content: CodegenContent): boolean {
	return !!content && content.mediaType.mimeType === 'application/x-www-form-urlencoded'
}

/** Re-exported from @openapi-generator-plus/types so templates have one place to look. */
export const isProperty = isCodegenProperty
export const isParam = isCodegenParameter

export type { CodegenContent, CodegenParameter, CodegenProperty, CodegenSchema, CodegenSchemaUsage }
