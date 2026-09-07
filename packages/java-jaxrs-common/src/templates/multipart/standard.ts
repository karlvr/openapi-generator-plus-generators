import { CodegenArraySchema, CodegenContentPropertyEncoding, CodegenRequestBody } from '@openapi-generator-plus/types'
import * as idx from '@openapi-generator-plus/indexed-type'
import { capitalize, identifier, indent, isArray, singular, stringLiteral } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from '../types'
import { getter, javax, setter } from '../helpers'
import { fromString } from '../util/fromString'
import { multipartPartCanBeNull, NO_MULTIPART_MESSAGE } from './helpers'

/**
 * The multipart templates that use the standard Jakarta REST API.
 *
 * Jakarta REST 3.1 declares `EntityPart`, and every implementation of that version supplies
 * a reader and a writer for a list of them. So these templates name no implementation.
 *
 * They refuse to render for JAX-RS 2.1, which declares no multipart API at all. Use the
 * templates of one implementation for that, such as {@link cxfMultipartTemplates}.
 */

/** The `EntityPart` type, in the package that the generator's options select. */
function entityPart(ctx: JavaModelContext): string {
	return `${javax(ctx.root.useJakarta)}.ws.rs.core.EntityPart`
}

/** Fail generation when the generator cannot express a multipart body. */
function requireJakarta(ctx: JavaModelContext): void {
	if (!ctx.root.useJakarta) {
		throw new Error(NO_MULTIPART_MESSAGE)
	}
}

/** The type that carries a multipart request body on a JAX-RS interface method. */
export function multipartBodyType(ctx: JavaModelContext): string {
	requireJakarta(ctx)
	return `java.util.List<${entityPart(ctx)}>`
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

	return `__multipartBody.add(${entityPart(ctx)}.withName(${stringLiteral(ctx.generatorContext, property.serializedName)})\n`
		+ `\t.content(${content}${valueAccessor})\n`
		+ `\t.mediaType(${stringLiteral(ctx.generatorContext, entry.contentType)})\n`
		+ headerLines
		+ '\t.build());'
}

/** One array-valued property's loop, adding one part per element. */
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
export function multipartBodyBuilding(requestBody: CodegenRequestBody, ctx: JavaModelContext): string {
	requireJakarta(ctx)
	const jx = javax(ctx.root.useJakarta)
	const properties = requestBody.defaultContent.encoding?.properties ? idx.allValues(requestBody.defaultContent.encoding.properties) : []
	const blocks = properties.map(entry => propertyBlock(entry, requestBody.name, ctx)).join('')

	/*
	 * Building a part reads its content, so it can fail. The API's own exception carries the
	 * failure, because a caller of the generated client handles only those.
	 */
	return `${multipartBodyType(ctx)} __multipartBody = new java.util.ArrayList<>();\n`
		+ 'try {\n'
		+ indent(blocks, '\t')
		+ '} catch (java.io.IOException __e) {\n'
		+ `\tthrow new ${ctx.root.apiPackage}.UnexpectedApiProcessingException(new ${jx}.ws.rs.ProcessingException(__e));\n`
		+ '}\n'
}

/** One part's assignment into the request model, for a server. */
function partAssignment(entry: CodegenContentPropertyEncoding, requestBodyName: string, ctx: JavaModelContext): string {
	const generator = ctx.generatorContext.generator()
	const useLombok = ctx.root.useLombok
	const { property, valueProperty, headerProperties } = entry
	const requestBodyIdentifier = identifier(generator, requestBodyName)
	const nameLiteral = stringLiteral(ctx.generatorContext, property.serializedName)

	const partType = isArray(property)
		? (property.schema as CodegenArraySchema).component.nativeType.concreteType
		: property.nativeType.concreteType
	const contentType = valueProperty ? valueProperty.nativeType.concreteType : partType

	const headerLines = headerProperties
		? idx.allKeys(headerProperties).map(key => {
			const headerProp = idx.get(headerProperties, key)!
			const headerValue = `__part.getHeaders().getFirst(${stringLiteral(ctx.generatorContext, key)})`
			return `\t__value.${setter(headerProp, generator, useLombok)}(${fromString(headerProp, headerValue)});\n`
		}).join('')
		: ''

	const build = valueProperty
		? `\t${partType} __value = new ${partType}();\n`
			+ `\t__value.${setter(valueProperty, generator, useLombok)}(__part.getContent(${contentType}.class));\n`
			+ headerLines
		: `\t${partType} __value = __part.getContent(${contentType}.class);\n`

	const store = isArray(property)
		? `\t${requestBodyIdentifier}.add${capitalize(singular(identifier(generator, property.name)))}(__value);\n`
		: `\t${requestBodyIdentifier}.${setter(property, generator, useLombok)}(${property.nullable ? 'java.util.Optional.of(__value)' : '__value'});\n`

	return `if (${nameLiteral}.equals(__part.getName())) {\n${build}${store}}\n`
}

/** Statements that read `__multipartBody` into the request model, for a server. */
export function multipartBodyParsing(requestBody: CodegenRequestBody, ctx: JavaModelContext): string {
	requireJakarta(ctx)
	const jx = javax(ctx.root.useJakarta)
	const generator = ctx.generatorContext.generator()
	const nativeType = requestBody.nativeType
	if (!nativeType) {
		throw new Error('multipartBodyParsing requires the request body to have a native type')
	}
	const properties = requestBody.defaultContent.encoding?.properties ? idx.allValues(requestBody.defaultContent.encoding.properties) : []
	const assignments = properties.map(entry => partAssignment(entry, requestBody.name, ctx)).join('')

	/*
	 * Reading a part's content can fail, and a resource method declares no checked
	 * exception. A part that the request cannot supply is a fault in the request.
	 */
	return `${nativeType} ${identifier(generator, requestBody.name)} = new ${nativeType.concreteType}();\n`
		+ 'try {\n'
		+ `\tfor (${entityPart(ctx)} __part : __multipartBody) {\n`
		+ indent(assignments, '\t\t')
		+ '\t}\n'
		+ '} catch (java.io.IOException __e) {\n'
		+ `\tthrow new ${jx}.ws.rs.BadRequestException(__e);\n`
		+ '}\n'
}
