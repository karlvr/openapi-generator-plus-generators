import { CodegenContentPropertyEncoding, CodegenProperty, CodegenRequestBody } from '@openapi-generator-plus/types'
import * as idx from '@openapi-generator-plus/indexed-type'
import { indent, isArray, stringLiteral } from '@openapi-generator-plus/template-utils'
import { accessor, componentType, FORM_ENCODING_CLASS, getter, guard, isPrimitive, JavaModelContext, multipartPartCanBeNull, present } from '@openapi-generator-plus/java-jaxrs-generator-common'

/** The builder that the generated method fills. */
const BODY = '__body'

/** The variable that holds the part under construction. */
const PART = '__part'

/** The media type that a part carries binary content under. */
const BINARY_CONTENT_TYPE = 'application/octet-stream'

/** The expression that reads `property` from the part held in `partVar`. */
function read(property: CodegenProperty, partVar: string, ctx: JavaModelContext): string {
	return `${partVar}.${getter(property, ctx.generatorContext.generator(), ctx.root.useLombok)}()`
}

/**
 * The expression that reads the content of one part.
 *
 * A part whose schema wraps its content declares a value property, and the content is that
 * property rather than the wrapper itself.
 */
function content(entry: CodegenContentPropertyEncoding, partVar: string, ctx: JavaModelContext): string {
	const { valueProperty } = entry
	if (!valueProperty) {
		return partVar
	}
	const value = read(valueProperty, partVar, ctx)
	return valueProperty.nullable ? `${value}.orElse(null)` : value
}

/** The expression that gives the bytes of one part, in the form that its own media type carries. */
function bytes(entry: CodegenContentPropertyEncoding, partVar: string, ctx: JavaModelContext): string {
	const expression = content(entry, partVar, ctx)
	if (entry.contentType === BINARY_CONTENT_TYPE) {
		return expression
	}
	if (/\bjson$/.test(entry.contentType)) {
		return `objectMapper.writeValueAsBytes(${expression})`
	}
	return `${ctx.root.supportPackage}.${FORM_ENCODING_CLASS}.text(${expression}).getBytes(java.nio.charset.StandardCharsets.UTF_8)`
}

/**
 * The expression that gives the value of one declared header, or `null` when the part does not
 * hold one.
 *
 * A header carries text, so any other type of value becomes its own text form. An absent value
 * and a null value both leave the header out.
 */
function headerValue(property: CodegenProperty, partVar: string, mayBeNull: boolean, ctx: JavaModelContext): string {
	const value = read(property, partVar, ctx)
	const text = property.nullable ? `java.lang.String.valueOf(${value}.get())` : `java.lang.String.valueOf(${value})`
	if (isPrimitive(property) && !mayBeNull) {
		return text
	}
	const held = property.nullable ? `${value} != null && ${value}.isPresent()` : `${value} != null`
	const condition = mayBeNull ? `${partVar} != null && ${held}` : held
	return `${condition} ? ${text} : null`
}

/**
 * The expression that gives the headers that the API declares for one part, or `null` when it
 * declares none.
 *
 * A declared header takes its value from a property of the part's own schema, so a part that
 * declares one always wraps its content.
 */
function headers(entry: CodegenContentPropertyEncoding, partVar: string, mayBeNull: boolean, ctx: JavaModelContext): string {
	const { headerProperties } = entry
	if (!headerProperties) {
		return 'null'
	}
	const pairs = idx.allKeys(headerProperties).map(key => {
		const property = idx.get(headerProperties, key)!
		const name = stringLiteral(ctx.generatorContext, key)
		return `\t{ ${name}, ${headerValue(property, partVar, mayBeNull, ctx)} },\n`
	}).join('')
	return `headers(new java.lang.String[][] {\n${pairs}})`
}

/** The statement that writes the part held in `partVar` into the multipart body. */
function addPart(entry: CodegenContentPropertyEncoding, partVar: string, mayBeNull: boolean, ctx: JavaModelContext): string {
	const name = stringLiteral(ctx.generatorContext, entry.property.serializedName)
	const contentType = stringLiteral(ctx.generatorContext, entry.contentType)
	return `addPart(${BODY}, ${name}, ${contentType}, ${headers(entry, partVar, mayBeNull, ctx)}, ${bytes(entry, partVar, ctx)});\n`
}

/** The statements that hold one part in `partVar`, then write it. */
function declaredPart(entry: CodegenContentPropertyEncoding, type: string, value: string, mayBeNull: boolean, ctx: JavaModelContext): string {
	return `${type} ${PART} = ${value};\n${addPart(entry, PART, mayBeNull, ctx)}`
}

/** The statements that write one part for each element of an array property. */
function arrayParts(entry: CodegenContentPropertyEncoding, value: string, ctx: JavaModelContext): string {
	const element = declaredPart(entry, componentType(entry.property), '__element', false, ctx)
	return `for (${componentType(entry.property)} __element : ${value}) {\n${indent(element, '\t')}}\n`
}

/**
 * The statements that write one property of the request model into the multipart body.
 *
 * A part encodes null in the form that its own media type carries, so a null part stays
 * distinct from an absent one. A binary part has no such form, so it is omitted.
 */
function multipartProperty(entry: CodegenContentPropertyEncoding, modelVar: string, ctx: JavaModelContext): string {
	const access = accessor(entry.property, modelVar, ctx)
	const { property } = entry

	if (isArray(property)) {
		return present(property, access, value => arrayParts(entry, value, ctx))
	}
	const type = String(property.nativeType)
	if (property.nullable && multipartPartCanBeNull(entry)) {
		return guard(`${access} != null`, declaredPart(entry, type, `${access}.isPresent() ? ${access}.get() : null`, true, ctx))
	}
	return present(property, access, value => declaredPart(entry, type, value, false, ctx))
}

/**
 * The statements that build a multipart body from the request model.
 *
 * The model is held in `modelVar`. The last statement returns the body.
 */
export function multipartBodyStatements(requestBody: CodegenRequestBody, modelVar: string, ctx: JavaModelContext): string {
	const mediaType = stringLiteral(ctx.generatorContext, requestBody.defaultContent.mediaType.mimeType)
	const properties = requestBody.defaultContent.encoding?.properties ? idx.allValues(requestBody.defaultContent.encoding.properties) : []
	return `okhttp3.MultipartBody.Builder ${BODY} = new okhttp3.MultipartBody.Builder()\n`
		+ `\t.setType(okhttp3.MediaType.get(${mediaType}));\n`
		+ properties.map(entry => multipartProperty(entry, modelVar, ctx)).join('')
		+ `return ${BODY}.build();\n`
}
