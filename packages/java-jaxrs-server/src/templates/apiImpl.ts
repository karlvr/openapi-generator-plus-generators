import {
	CodegenArraySchema,
	CodegenContentPropertyEncoding,
	CodegenHeader,
	CodegenOperation,
	CodegenOperationGroup,
	CodegenResponse,
} from '@openapi-generator-plus/types'
import * as idx from '@openapi-generator-plus/indexed-type'
import { className, identifier, indent, isArray, isContentMultipart, singular, capitalize, stringLiteral, SKIP } from '@openapi-generator-plus/template-utils'
import {
	InjectParams, imports, generatedAnnotation, javax, getter, setter, fromString,
	operationVars, operationDocumentation, beanValidationValidateParams,
} from '@openapi-generator-plus/java-jaxrs-generator-common'
import { ServerContext } from './types'
import { bodyParam } from './frag/bodyParam'
import { beanValidationValidateResponse } from './frag/beanValidationValidateResponse'
import { MyResponse } from '../internal-types'

/** One header's value assignment on a parsed multipart part, converting the attachment header's string value to the header property's type. */
function multipartHeaderAssignments(entry: CodegenContentPropertyEncoding, ctx: ServerContext): string {
	if (!entry.headerProperties) {
		return ''
	}
	const generator = ctx.generatorContext.generator()
	const useLombok = ctx.root.useLombok
	return idx.allKeys(entry.headerProperties).map(key => {
		const headerProp = idx.get(entry.headerProperties!, key)!
		const headerValue = `__attachment.getHeader(${stringLiteral(ctx.generatorContext, key)})`
		return `\t\t\t\t__part.${setter(headerProp, generator, useLombok)}(${fromString(headerProp, headerValue)});\n`
	}).join('')
}

/** One multipart part's assignment into the request body, for an array-valued (repeated) multipart property. */
function multipartArrayProperty(entry: CodegenContentPropertyEncoding, requestBodyName: string, ctx: ServerContext): string {
	const generator = ctx.generatorContext.generator()
	const useLombok = ctx.root.useLombok
	const { property, valueProperty } = entry
	const serializedNameLit = stringLiteral(ctx.generatorContext, property.serializedName)
	const requestBodyIdentifier = identifier(generator, requestBodyName)
	const componentConcreteType = (property.schema as CodegenArraySchema).component.nativeType.concreteType
	const addMethodName = `add${capitalize(singular(identifier(generator, property.name)))}`

	const body = valueProperty
		? `\t\t\t\t${componentConcreteType} __part = new ${componentConcreteType}();\n`
			+ multipartHeaderAssignments(entry, ctx)
			+ `\t\t\t\t__part.${setter(valueProperty, generator, useLombok)}(__multipartBody.getAttachmentObject(${stringLiteral(ctx.generatorContext, property.name)}, ${valueProperty.nativeType.concreteType}.class));\n`
			+ `\t\t\t\t${requestBodyIdentifier}.${addMethodName}(__part);\n`
		: `\t\t\t\t${requestBodyIdentifier}.${addMethodName}(__multipartBody.getAttachmentObject(${serializedNameLit}, ${componentConcreteType}.class));\n`

	return '\t\tfor (org.apache.cxf.jaxrs.ext.multipart.Attachment __attachment : __multipartBody.getAllAttachments()) {\n'
		+ `\t\t\tif (${serializedNameLit}.equals(__attachment.getContentId()) || (__attachment.getContentDisposition() != null && ${serializedNameLit}.equals(__attachment.getContentDisposition().getParameter("name")))) {\n`
		+ body
		+ '\t\t\t}\n'
		+ '\t\t}\n'
}

/** One multipart part's assignment into the request body, for a single-valued multipart property. */
function multipartSingleProperty(entry: CodegenContentPropertyEncoding, requestBodyName: string, ctx: ServerContext): string {
	const generator = ctx.generatorContext.generator()
	const useLombok = ctx.root.useLombok
	const { property, valueProperty } = entry
	const serializedNameLit = stringLiteral(ctx.generatorContext, property.serializedName)
	const requestBodyIdentifier = identifier(generator, requestBodyName)
	const optionalOpen = property.nullable ? 'java.util.Optional.of(' : ''
	const optionalClose = property.nullable ? ')' : ''

	const body = valueProperty
		? `\t\t\t\t${property.nativeType.concreteType} __part = new ${property.nativeType.concreteType}();\n`
			+ `\t\t\t\t__part.${setter(valueProperty, generator, useLombok)}(__attachment.getObject(${valueProperty.nativeType.concreteType}.class));\n`
			+ multipartHeaderAssignments(entry, ctx)
			+ `\t\t\t\t${requestBodyIdentifier}.${setter(property, generator, useLombok)}(${optionalOpen}__part${optionalClose});\n`
		: `\t\t\t\t${requestBodyIdentifier}.${setter(property, generator, useLombok)}(${optionalOpen}__attachment.getObject(${property.nativeType.concreteType}.class)${optionalClose});\n`

	return '\t\t{\n'
		+ `\t\t\torg.apache.cxf.jaxrs.ext.multipart.Attachment __attachment = __multipartBody.getAttachment(${serializedNameLit});\n`
		+ '\t\t\tif (__attachment != null) {\n'
		+ body
		+ '\t\t\t}\n'
		+ '\t\t}\n'
}

/**
 * Parses the request body's multipart parts into the generated multipart container class,
 * when the operation's request body is multipart. Renders `''` (nothing) otherwise.
 */
function multipartParsing(operation: CodegenOperation, ctx: ServerContext): string {
	const requestBody = operation.requestBody
	if (!requestBody?.nativeType || !isContentMultipart(requestBody.defaultContent)) {
		return ''
	}
	const generator = ctx.generatorContext.generator()
	const properties = requestBody.defaultContent.encoding?.properties ? idx.allValues(requestBody.defaultContent.encoding.properties) : []

	const varDecl = `\t\t${requestBody.nativeType} ${identifier(generator, requestBody.name)} = new ${requestBody.nativeType.concreteType}();\n`
	const propertyBlocks = properties.map(entry => {
		const comment = `\t\t/* Multipart: ${entry.property.name} */\n`
		const assignment = isArray(entry.property)
			? multipartArrayProperty(entry, requestBody.name, ctx)
			: multipartSingleProperty(entry, requestBody.name, ctx)
		return comment + assignment
	}).join('')

	return `${varDecl}${propertyBlocks}\n`
}

/** The `final Response.ResponseBuilder __response = ...` declaration, seeded with the default response's status and cache-control header. */
function responseBuilderDecl(defaultResponse: CodegenResponse, ctx: ServerContext): string {
	const jx = javax(ctx.root.useJakarta)
	const cacheControlExtension = defaultResponse.vendorExtensions?.['x-cache-control']
	const cacheControl = cacheControlExtension !== undefined ? String(cacheControlExtension) : 'no-cache, no-store, must-revalidate, private'
	return `\t\tfinal ${jx}.ws.rs.core.Response.ResponseBuilder __response = ${jx}.ws.rs.core.Response.status(${String(defaultResponse.code)}).cacheControl(${jx}.ws.rs.ext.RuntimeDelegate.getInstance().createHeaderDelegate(${jx}.ws.rs.core.CacheControl.class).fromString("${cacheControl}"));\n`
}

/** The `try` block's call to the delegate API service, and building the response entity from its result (or the response wrapper's headers). */
function tryDelegateCall(operation: CodegenOperation, args: string, ctx: ServerContext): string {
	const defaultResponse = operation.defaultResponse as MyResponse
	const generator = ctx.generatorContext.generator()
	const useLombok = ctx.root.useLombok
	const name = operation.name
	const wrapper = defaultResponse.__wrapper

	const delegateCall = wrapper
		? `${wrapper.nativeType} __wrapper = this.delegate.${name}(${args});\n`
			+ (wrapper.bodyNativeType ? `${wrapper.bodyNativeType} __entity = __wrapper.getBody();\n` : '')
			+ (wrapper.headers ?? []).map(h => `__response.header(${stringLiteral(ctx.generatorContext, h.serializedName)}, null).header(${stringLiteral(ctx.generatorContext, h.serializedName)}, __wrapper.${getter(h, generator, useLombok)}());\n`).join('')
		: `${defaultResponse.defaultContent?.nativeType ? `${defaultResponse.defaultContent.nativeType} __entity = ` : ''}this.delegate.${name}(${args});\n`

	const entityHandling = defaultResponse.defaultContent?.nativeType
		? (ctx.root.useBeanValidation && defaultResponse.defaultContent.schema
			? `${beanValidationValidateResponse('__entity', defaultResponse.defaultContent.schema, defaultResponse, ctx)}\n`
			: '')
			+ '__response.entity(__entity);\n'
			+ `__response.type(${stringLiteral(ctx.generatorContext, defaultResponse.defaultContent.mediaType.mediaType)});\n`
		: ''

	return indent(`${delegateCall}${entityHandling}return __response.build();`, '\t\t\t')
}

/** One non-default response's `catch` clause, converting the service exception into the JAX-RS response. */
function catchBlock(operation: CodegenOperation, group: CodegenOperationGroup, response: CodegenResponse, ctx: ServerContext): string {
	if (response.isDefault) {
		return ''
	}
	const generator = ctx.generatorContext.generator()
	const useLombok = ctx.root.useLombok
	const groupName = className(generator, group.name)
	const exceptionName = `${className(generator, `${operation.name}_${response.code}`)}Exception`

	const statusLine = response.isCatchAll
		? '__response.status(__e.getResponseCode());'
		: `__response.status(${String(response.code)});`

	const headers: CodegenHeader[] = response.headers ? idx.allValues(response.headers) : []
	const headerLines = headers.map(h => `__response.header(${stringLiteral(ctx.generatorContext, h.serializedName)}, null).header(${stringLiteral(ctx.generatorContext, h.serializedName)}, __e.${getter(h, generator, useLombok)}());\n`).join('')

	const entityBlock = response.defaultContent?.nativeType
		? (ctx.root.useBeanValidation && response.defaultContent.schema
			? `${beanValidationValidateResponse('__e.getEntity()', response.defaultContent.schema, response as MyResponse, ctx)}\n`
			: '')
			+ '__response.entity(__e.getEntity());\n'
			+ `__response.type(${stringLiteral(ctx.generatorContext, response.defaultContent.mediaType.mediaType)});\n`
		: ''

	const body = indent(`${statusLine}\n${headerLines}${entityBlock}return __response.build();`, '\t\t\t')

	return `\t\t} catch (${ctx.root.apiServicePackage}.${groupName}ApiService.${exceptionName} __e) {\n${body}\n`
}

/** One operation's JAX-RS implementation method, delegating to the API service. */
function operationMethod(operation: CodegenOperation, group: CodegenOperationGroup, ctx: ServerContext): string {
	const jx = javax(ctx.root.useJakarta)
	const { parameters, arguments: args } = operationVars(operation, { jaxrs: false, service: false }, bodyParam, ctx)
	const defaultResponse = operation.defaultResponse as MyResponse | null
	if (!defaultResponse) {
		throw new Error(`apiImpl requires operation "${operation.name}" to have a default response`)
	}
	const responses = operation.responses ? idx.allValues(operation.responses) : []

	const doc = operationDocumentation(operation)
	const docLine = typeof doc === 'string' ? `${indent(doc, '\t')}\n` : ''
	const deprecatedLine = operation.deprecated ? '\t@java.lang.SuppressWarnings("deprecation")\n' : ''

	const catchBlocksText = responses.map(response => catchBlock(operation, group, response, ctx)).join('')

	const beanValidation = ctx.root.useBeanValidation ? beanValidationValidateParams(operation, ctx) : SKIP
	const beanValidationText = typeof beanValidation === 'string' ? indent(beanValidation, '\t\t\t') : ''

	return `${docLine}\t@java.lang.Override\n${deprecatedLine}\tpublic ${jx}.ws.rs.core.Response ${operation.name}(${parameters}) {\n`
		+ multipartParsing(operation, ctx)
		+ responseBuilderDecl(defaultResponse, ctx)
		+ '\t\ttry {\n'
		+ beanValidationText
		+ tryDelegateCall(operation, args, ctx) + '\n'
		+ catchBlocksText
		+ '\t\t} finally {\n\n\t\t}\n'
		+ '\t}\n\n'
}

/** This generator group's API implementation class: one JAX-RS method per operation, delegating to the API service. */
export function apiImpl(group: CodegenOperationGroup, ctx: ServerContext): string {
	const generator = ctx.generatorContext.generator()
	const name = className(generator, group.name)
	const jx = javax(ctx.root.useJakarta)

	const injectParams: InjectParams = {
		interface: `${ctx.root.apiServicePackage}.${name}ApiService`,
		class: `${ctx.root.apiServiceImplPackage ?? ''}.${name}ApiServiceImpl`,
		name: 'delegate',
	}

	const validatorField = ctx.root.useBeanValidation
		? `\tprivate ${jx}.validation.ValidatorFactory validatorFactory = ${jx}.validation.Validation.buildDefaultValidatorFactory();\n\n`
		: ''

	const importsText = imports(ctx.root)
	const classAnnotations = ctx.templates.apiImplClassAnnotations(group, ctx)

	const header = `package ${ctx.root.apiImplPackage};\n\n`
		+ (typeof importsText === 'string' ? `${importsText}\n` : '')
		+ `${generatedAnnotation(ctx.root)}\n`
		+ (typeof classAnnotations === 'string' ? `${classAnnotations}\n` : '')
		+ `public class ${name}ApiImpl implements ${ctx.root.apiPackage}.${name}Api {\n\n`
		+ `\t${ctx.templates.inject(injectParams, ctx)}\n\n`
		+ validatorField

	const operations = group.operations.map(operation => operationMethod(operation, group, ctx)).join('')

	return `${header}${operations}}\n`
}
