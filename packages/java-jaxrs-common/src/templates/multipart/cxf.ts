import { CodegenArraySchema, CodegenContentPropertyEncoding, CodegenRequestBody } from '@openapi-generator-plus/types'
import * as idx from '@openapi-generator-plus/indexed-type'
import { capitalize, identifier, indent, isArray, singular, stringLiteral } from '@openapi-generator-plus/template-utils'
import { JavaJaxrsTemplates, JavaModelContext } from '../types'
import { escapeString, getter, javax, setter } from '../helpers'
import { fromString } from '../util/fromString'
import { multipartPartCanBeNull } from './helpers'

/*
 * The multipart templates that use CXF's own multipart API.
 *
 * JAX-RS 2.1 declares no multipart API, so a generator that targets CXF needs CXF's. Wire
 * `cxfMultipartTemplates` into a generator whose project depends on CXF. Every other
 * generator uses the standard templates, which need Jakarta REST 3.1.
 *
 * CXF's multipart support is javax-only, so these render `javax` types whatever the
 * `useJakarta` option says.
 */

/** The type that carries a multipart request body on a JAX-RS interface method. */
function multipartBodyType(): string {
	return 'org.apache.cxf.jaxrs.ext.multipart.MultipartBody'
}

/** The value a part sends for null, in the form that its own content type can carry. */
function nullForm(entry: CodegenContentPropertyEncoding): string {
	if (entry.contentType === 'application/json') {
		return 'com.fasterxml.jackson.databind.node.NullNode.getInstance()'
	}
	return '""'
}

/** One part's builder call, adding it to the list under construction. */
function part(entry: CodegenContentPropertyEncoding, propertyVar: string, content: string, ctx: JavaModelContext): string {
	const { property, valueProperty, headerProperties } = entry
	const generator = ctx.generatorContext.generator()
	const useLombok = ctx.root.useLombok

	const valueAccessor = valueProperty
		? `.${getter(valueProperty, generator, useLombok)}()${valueProperty.nullable ? '.orElse(null)' : ''}`
		: ''

	const headerLines = headerProperties
		? idx.allKeys(headerProperties).map(key => {
			const accessor = `${propertyVar}.${getter(idx.get(headerProperties, key)!, generator, useLombok)}()`
			return `\t.header(${stringLiteral(ctx.generatorContext, key)}, ${accessor} != null ? ${accessor}.toString() : null)\n`
		}).join('')
		: ''

	/*
	 * A form data part needs both. The builder takes the name from the id, and writes it into
	 * the disposition that it sends. A part with no id arrives named `null`.
	 */
	const nameLiteral = stringLiteral(ctx.generatorContext, property.serializedName)

	return '__multipartBodyParts.add(new org.apache.cxf.jaxrs.ext.multipart.AttachmentBuilder()\n'
		+ `\t.object(${content}${valueAccessor})\n`
		+ `\t.mediaType(${stringLiteral(ctx.generatorContext, entry.contentType)})\n`
		+ `\t.id(${nameLiteral})\n`
		+ `\t.contentDisposition(new org.apache.cxf.jaxrs.ext.multipart.ContentDisposition("form-data; name=\\"${escapeString(property.serializedName)}\\""))\n`
		+ headerLines
		+ '\t.build());'
}

/** One array-valued property's loop, adding one attachment per element. */
function arrayProperty(entry: CodegenContentPropertyEncoding, propertyVar: string, ctx: JavaModelContext): string {
	const { property } = entry
	const componentSchema = (property.schema as CodegenArraySchema).component
	const componentType = String(componentSchema.nativeType.componentType ?? '')

	const loop = (iterable: string) => `for (${componentType} __anObject : ${iterable}) {\n`
		+ indent(part(entry, '__anObject', '__anObject', ctx), '\t')
		+ '\n}'

	if (property.nullable) {
		return `if (${propertyVar}.isPresent()) {\n${indent(loop(`${propertyVar}.get()`), '\t')}\n}`
	}
	return loop(propertyVar)
}

/** One property's contribution to the body, guarded by its own presence check. */
function propertyBlock(entry: CodegenContentPropertyEncoding, requestBodyName: string, ctx: JavaModelContext): string {
	const generator = ctx.generatorContext.generator()
	const { property } = entry
	const propertyVar = `${identifier(generator, requestBodyName)}.${getter(property, generator, ctx.root.useLombok)}()`

	/*
	 * A binary part has no null form, so a null value omits the part. Every other part
	 * encodes null itself, and stays distinct from an absent part.
	 */
	const omitWhenNull = property.nullable && !isArray(property) && !multipartPartCanBeNull(entry)
	const present = omitWhenNull
		? `${propertyVar} != null && ${propertyVar}.isPresent()`
		: `${propertyVar} != null`

	const content = !property.nullable
		? propertyVar
		: omitWhenNull
			? `${propertyVar}.get()`
			: `!${propertyVar}.isPresent() ? ${nullForm(entry)} : ${propertyVar}.get()`

	const body = isArray(property)
		? arrayProperty(entry, propertyVar, ctx)
		: part(entry, propertyVar, content, ctx)

	return `if (${present}) {\n${indent(body, '\t')}\n}\n`
}

/** Statements that build `__multipartBody` from the request model, for a client. */
function multipartBodyBuilding(requestBody: CodegenRequestBody, ctx: JavaModelContext): string {
	const properties = requestBody.defaultContent.encoding?.properties ? idx.allValues(requestBody.defaultContent.encoding.properties) : []
	const blocks = properties.map(entry => propertyBlock(entry, requestBody.name, ctx)).join('')

	return 'java.util.ArrayList<org.apache.cxf.jaxrs.ext.multipart.Attachment> __multipartBodyParts = new java.util.ArrayList<>();\n'
		+ blocks
		+ `${multipartBodyType()} __multipartBody = new ${multipartBodyType()}(\n`
		+ '\t__multipartBodyParts,\n'
		+ `\t${javax(ctx.root.useJakarta)}.ws.rs.core.MediaType.valueOf(${stringLiteral(ctx.generatorContext, requestBody.defaultContent.mediaType.mediaType)}),\n`
		+ '\ttrue\n'
		+ ');\n'
}

/** One header's value assignment on a parsed part. */
function headerAssignments(entry: CodegenContentPropertyEncoding, indentText: string, ctx: JavaModelContext): string {
	if (!entry.headerProperties) {
		return ''
	}
	const generator = ctx.generatorContext.generator()
	const useLombok = ctx.root.useLombok
	return idx.allKeys(entry.headerProperties).map(key => {
		const headerProp = idx.get(entry.headerProperties!, key)!
		const headerValue = `__attachment.getHeader(${stringLiteral(ctx.generatorContext, key)})`
		return `${indentText}__part.${setter(headerProp, generator, useLombok)}(${fromString(headerProp, headerValue)});\n`
	}).join('')
}

/** One array-valued property's assignment into the request model, for a server. */
function arrayPropertyAssignment(entry: CodegenContentPropertyEncoding, requestBodyName: string, ctx: JavaModelContext): string {
	const generator = ctx.generatorContext.generator()
	const useLombok = ctx.root.useLombok
	const { property, valueProperty } = entry
	const nameLiteral = stringLiteral(ctx.generatorContext, property.serializedName)
	const requestBodyIdentifier = identifier(generator, requestBodyName)
	const componentConcreteType = (property.schema as CodegenArraySchema).component.nativeType.concreteType
	const addMethodName = `add${capitalize(singular(identifier(generator, property.name)))}`

	const body = valueProperty
		? `\t\t\t${componentConcreteType} __part = new ${componentConcreteType}();\n`
			+ headerAssignments(entry, '\t\t\t', ctx)
			+ `\t\t\t__part.${setter(valueProperty, generator, useLombok)}(__multipartBody.getAttachmentObject(${stringLiteral(ctx.generatorContext, property.name)}, ${valueProperty.nativeType.concreteType}.class));\n`
			+ `\t\t\t${requestBodyIdentifier}.${addMethodName}(__part);\n`
		: `\t\t\t${requestBodyIdentifier}.${addMethodName}(__multipartBody.getAttachmentObject(${nameLiteral}, ${componentConcreteType}.class));\n`

	return 'for (org.apache.cxf.jaxrs.ext.multipart.Attachment __attachment : __multipartBody.getAllAttachments()) {\n'
		+ `\t\tif (${nameLiteral}.equals(__attachment.getContentId()) || (__attachment.getContentDisposition() != null && ${nameLiteral}.equals(__attachment.getContentDisposition().getParameter("name")))) {\n`
		+ body
		+ '\t\t}\n'
		+ '\t}\n'
}

/** One single-valued property's assignment into the request model, for a server. */
function singlePropertyAssignment(entry: CodegenContentPropertyEncoding, requestBodyName: string, ctx: JavaModelContext): string {
	const generator = ctx.generatorContext.generator()
	const useLombok = ctx.root.useLombok
	const { property, valueProperty } = entry
	const nameLiteral = stringLiteral(ctx.generatorContext, property.serializedName)
	const requestBodyIdentifier = identifier(generator, requestBodyName)
	const optionalOpen = property.nullable ? 'java.util.Optional.of(' : ''
	const optionalClose = property.nullable ? ')' : ''

	const body = valueProperty
		? `\t\t\t${property.nativeType.concreteType} __part = new ${property.nativeType.concreteType}();\n`
			+ `\t\t\t__part.${setter(valueProperty, generator, useLombok)}(__attachment.getObject(${valueProperty.nativeType.concreteType}.class));\n`
			+ headerAssignments(entry, '\t\t\t', ctx)
			+ `\t\t\t${requestBodyIdentifier}.${setter(property, generator, useLombok)}(${optionalOpen}__part${optionalClose});\n`
		: `\t\t\t${requestBodyIdentifier}.${setter(property, generator, useLombok)}(${optionalOpen}__attachment.getObject(${property.nativeType.concreteType}.class)${optionalClose});\n`

	return '{\n'
		+ `\t\torg.apache.cxf.jaxrs.ext.multipart.Attachment __attachment = __multipartBody.getAttachment(${nameLiteral});\n`
		+ '\t\tif (__attachment != null) {\n'
		+ body
		+ '\t\t}\n'
		+ '\t}\n'
}

/** Statements that read `__multipartBody` into the request model, for a server. */
function multipartBodyParsing(requestBody: CodegenRequestBody, ctx: JavaModelContext): string {
	const generator = ctx.generatorContext.generator()
	const nativeType = requestBody.nativeType
	if (!nativeType) {
		throw new Error('multipartBodyParsing requires the request body to have a native type')
	}
	const properties = requestBody.defaultContent.encoding?.properties ? idx.allValues(requestBody.defaultContent.encoding.properties) : []

	const blocks = properties.map(entry => {
		const comment = `/* Multipart: ${entry.property.name} */\n`
		const assignment = isArray(entry.property)
			? arrayPropertyAssignment(entry, requestBody.name, ctx)
			: singlePropertyAssignment(entry, requestBody.name, ctx)
		return comment + assignment
	}).join('')

	return `${nativeType} ${identifier(generator, requestBody.name)} = new ${nativeType.concreteType}();\n`
		+ blocks
}

/**
 * The multipart templates for a generator whose project depends on CXF.
 *
 * Spread these into a generator's own hook bag. Without them a generator uses the standard
 * templates, which need Jakarta REST 3.1.
 */
export const cxfMultipartTemplates: Pick<JavaJaxrsTemplates, 'multipartBodyType' | 'multipartBodyBuilding' | 'multipartBodyParsing'> = {
	multipartBodyType: () => multipartBodyType(),
	multipartBodyBuilding,
	multipartBodyParsing,
}
