import { CodegenArraySchema, CodegenContent, CodegenContentPropertyEncoding, CodegenOperation, CodegenOperationGroup, CodegenResponse } from '@openapi-generator-plus/types'
import * as idx from '@openapi-generator-plus/indexed-type'
import { indent, isArray, isContentMultipart, identifier, className, stringLiteral, nonDefaultResponses, nonDefaultAndCatchAllResponses, responseContentAndNone, SKIP, Skip } from '@openapi-generator-plus/template-utils'
import { imports, operationVars, generatedAnnotation, javax, getter } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { ClientContext } from './types'
import { bodyParam } from './frag/bodyParam'
import { multipartProperty } from './frag/multipartProperty'
import { exceptionName } from './api'

const HTML_ESCAPE_CHARS: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#x27;', '`': '&#x60;', '=': '&#x3D;' }

/**
 * Mirrors Handlebars' double-stache HTML-escaping. The original template's multipart debug
 * comment renders the array component's native type with a double-stache instead of a
 * triple-stache (unlike every other value on the same lines) — so if that type contains
 * angle brackets, they render HTML-escaped in the comment. Ported faithfully.
 */
function htmlEscape(value: string): string {
	return value.replace(/[&<>"'`=]/g, char => HTML_ESCAPE_CHARS[char])
}

/** One array-valued multipart property's `for` loop over its elements, each added as its own attachment. */
function arrayMultipartBody(entry: CodegenContentPropertyEncoding, propertyVar: string, content: CodegenContent, ctx: ClientContext): string {
	const { property } = entry
	const componentSchema = (property.schema as CodegenArraySchema).component
	const componentType = componentSchema.nativeType.componentType
	const componentTypeStr = componentType ? String(componentType) : ''

	const comment = `// property ${property.name}, nullable ${String(property.nullable)}, native type ${String(property.nativeType)}\n`
		+ `// component nullable ${String(componentSchema.nullable)}, native type ${htmlEscape(componentTypeStr)}\n`

	const attachmentCall = multipartProperty(entry, { propertyVar: '__anObject', bodyPartsVar: '__multipartBodyParts', content, schemaUsage: componentSchema }, ctx)
	const forLoop = (iterable: string) => `for (${componentTypeStr} __anObject : ${iterable}) {\n${indent(attachmentCall, '\t')}\n}`

	if (property.nullable) {
		return `${comment}if (${propertyVar}.isPresent()) {\n${indent(forLoop(`${propertyVar}.get()`), '\t')}\n}`
	}
	return `${comment}${forLoop(propertyVar)}`
}

/** One multipart property's contribution to the request body being built, guarded by a null check. */
function multipartPropertyBlock(entry: CodegenContentPropertyEncoding, requestBodyName: string, content: CodegenContent, ctx: ClientContext): string {
	const generator = ctx.generatorContext.generator()
	const { property } = entry
	const propertyVar = `${identifier(generator, requestBodyName)}.${getter(property, generator, ctx.root.useLombok)}()`

	const body = isArray(property)
		? arrayMultipartBody(entry, propertyVar, content, ctx)
		: multipartProperty(entry, { propertyVar, bodyPartsVar: '__multipartBodyParts', content, schemaUsage: property }, ctx)

	return `if (${propertyVar} != null) {\n${indent(body, '\t')}\n}\n`
}

/**
 * The multipart request body this operation sends, built into `__multipartBodyParts`. SKIP
 * (rendering nothing) when the operation's request body isn't multipart.
 */
function multipartBuilding(operation: CodegenOperation, ctx: ClientContext): string | Skip {
	const requestBody = operation.requestBody
	if (!requestBody || !isContentMultipart(requestBody.defaultContent)) {
		return SKIP
	}

	const properties = requestBody.defaultContent.encoding?.properties ? idx.allValues(requestBody.defaultContent.encoding.properties) : []
	const propertyBlocks = properties.map(entry => multipartPropertyBlock(entry, requestBody.name, requestBody.defaultContent, ctx)).join('')

	/* CXF's multipart support is javax-only, so this is hardcoded regardless of `useJakarta` — matching the original template. */
	return 'java.util.ArrayList<org.apache.cxf.jaxrs.ext.multipart.Attachment> __multipartBodyParts = new java.util.ArrayList<>();\n'
		+ propertyBlocks
		+ 'org.apache.cxf.jaxrs.ext.multipart.MultipartBody __multipartBody = new org.apache.cxf.jaxrs.ext.multipart.MultipartBody(\n'
		+ '\t__multipartBodyParts,\n'
		+ `\tjavax.ws.rs.core.MediaType.valueOf(${stringLiteral(ctx.generatorContext, requestBody.defaultContent.mediaType.mediaType)}),\n`
		+ '\ttrue\n'
		+ ');\n'
}

/** The response's contents, dispatched on the response's media type, each throwing its own exception class. */
function mediaTypeDispatchBlock(operation: CodegenOperation, response: CodegenResponse, ctx: ClientContext): string {
	const jx = javax(ctx.root.useJakarta)
	const contents = response.contents ?? []

	const throwLines = contents.map((content, i) => {
		const name = exceptionName(operation, response, content.mediaType.mediaType, i === 0, ctx)
		const arg = content.nativeType ? `__e.getResponse().readEntity(${content.nativeType.literalType}.class)` : ''
		return `if (__e.getResponse().getMediaType().isCompatible(${jx}.ws.rs.core.MediaType.valueOf(${stringLiteral(ctx.generatorContext, content.mediaType.mediaType)}))) {\n\tthrow new ${name}(${arg});\n}\n`
	}).join('')

	const unsupportedMediaType = `throw new ${ctx.root.apiPackage}.UnprocessableResponseException(__e.getResponse(), new ${jx}.ws.rs.ProcessingException("Unsupported media type for response status " + __e.getResponse().getStatus() + ": " + __e.getResponse().getMediaType()));\n`

	return 'try {\n'
		+ indent(`${throwLines}\n${unsupportedMediaType}`, '\t')
		+ `} catch (${jx}.ws.rs.ProcessingException __processingException) {\n`
		+ `\tthrow new ${ctx.root.apiPackage}.UnprocessableResponseException(__e.getResponse(), __processingException);\n`
		+ '}\n'
}

/** One non-default, non-catch-all response's `catch` gate: matches its status code, then dispatches on media type. */
function nonDefaultCatchBlock(operation: CodegenOperation, response: CodegenResponse, ctx: ClientContext): string {
	return `if (__e.getResponse().getStatus() == ${String(response.code)}) {\n${indent(mediaTypeDispatchBlock(operation, response, ctx), '\t')}}\n`
}

/** The catch-all response's dispatch, ungated by status code (it applies to every status the other `catch` gates didn't match). */
function catchAllCatchBlock(operation: CodegenOperation, response: CodegenResponse, ctx: ClientContext): string {
	return `/* Catch-all response */\n${mediaTypeDispatchBlock(operation, response, ctx)}`
}

/** One operation's JAX-RS implementation method, invoking the low-level `ApiSpec` and translating its responses into this API's exceptions. */
function operationMethod(operation: CodegenOperation, ctx: ClientContext): string {
	const generator = ctx.generatorContext.generator()
	const jx = javax(ctx.root.useJakarta)
	const { parameters, arguments: baseArgs } = operationVars(operation, { jaxrs: false, service: false }, bodyParam, ctx)
	const isMultipart = !!operation.requestBody && isContentMultipart(operation.requestBody.defaultContent)
	/* A multipart request body is sent as `__multipartBody`, not the request body's own variable — recomputed here to match. */
	const callArgs = isMultipart
		? operationVars(operation, { jaxrs: false, service: false, requestBodyVar: '__multipartBody' }, bodyParam, ctx).arguments
		: baseArgs

	const returnType = operation.returnNativeType ? `${operation.returnNativeType}` : 'void'
	const exceptionNames = nonDefaultResponses(operation).flatMap(response =>
		responseContentAndNone(response).map((entry, i) => exceptionName(operation, response, entry.content?.mediaType.mediaType ?? null, i === 0, ctx)))
	const throwsClause = `${ctx.root.apiPackage}.UnexpectedApiException${exceptionNames.map(name => `, ${name}`).join('')}`

	const returnPrefix = operation.returnNativeType ? 'return ' : ''
	const call = `${returnPrefix}api.${identifier(generator, operation.name)}(${callArgs});`

	const authorizeBlock = operation.securityRequirements ? 'if (authorizationProvider != null) {\n\tauthorizationProvider.authorize(this);\n}\n\n' : ''

	const multipart = multipartBuilding(operation, ctx)
	const multipartText = typeof multipart === 'string' ? `${multipart}\n` : ''

	const tryBody = operation.securityRequirements ? `try {
	${call}
} catch (${jx}.ws.rs.WebApplicationException __e) {
	if (__e.getResponse().getStatus() == 401 && authorizationProvider != null) {
		if (authorizationProvider.reauthorize(this, __e.getResponse())) {
			${call}
		}
	}
	throw __e;
}
` : `${call}\n`

	const catchBlocks = nonDefaultAndCatchAllResponses(operation).map(response => nonDefaultCatchBlock(operation, response, ctx)).join('')
	const catchAllOrFallback = operation.catchAllResponse
		? catchAllCatchBlock(operation, operation.catchAllResponse, ctx)
		: `throw new ${ctx.root.apiPackage}.UnexpectedResponseException(__e.getResponse(), __e);\n`

	const deprecatedLine = operation.deprecated ? '\t@java.lang.SuppressWarnings("deprecation")\n' : ''

	return `\t@java.lang.Override\n${deprecatedLine}\tpublic ${returnType} ${identifier(generator, operation.name)}(${parameters}) throws ${throwsClause} {\n`
		+ indent(authorizeBlock + multipartText, '\t\t')
		+ '\t\ttry {\n'
		+ indent(tryBody, '\t\t\t')
		+ `\t\t} catch (${jx}.ws.rs.WebApplicationException __e) {\n`
		+ indent(catchBlocks + catchAllOrFallback, '\t\t\t')
		+ `\t\t} catch (${jx}.ws.rs.client.ResponseProcessingException __e) {\n`
		+ `\t\t\tthrow new ${ctx.root.apiPackage}.UnprocessableResponseException(__e.getResponse(), __e);\n`
		+ `\t\t} catch (${jx}.ws.rs.ProcessingException __e) {\n`
		+ '\t\t\tif (__e.getCause() instanceof java.net.SocketTimeoutException) {\n'
		+ `\t\t\t\tthrow new ${ctx.root.apiPackage}.UnexpectedTimeoutException((java.net.SocketTimeoutException) __e.getCause());\n`
		+ '\t\t\t}\n'
		+ `\t\t\tthrow new ${ctx.root.apiPackage}.UnexpectedApiProcessingException(__e);\n`
		+ '\t\t}\n'
		+ '\t}\n\n'
}

/**
 * This generator group's API implementation class: one JAX-RS-client-invoking method per
 * operation, translating the low-level `ApiSpec`'s JAX-RS responses into this API's checked
 * exceptions.
 */
export function apiImpl(group: CodegenOperationGroup, ctx: ClientContext): string {
	const generator = ctx.generatorContext.generator()
	const name = className(generator, group.name)

	const injectApi = ctx.templates.injectApi
	if (!injectApi) {
		throw new Error('apiImpl requires templates.injectApi to be set (java-jaxrs-client always provides a default)')
	}

	const importsText = imports(ctx.root)
	const header = `package ${ctx.root.apiImplPackage};\n\n`
		+ (typeof importsText === 'string' ? `${importsText}\n` : '')
		+ apiImplHeaderText(ctx)
		+ `${generatedAnnotation(ctx.root)}\n`
		+ `public class ${name}ApiImpl implements ${ctx.root.apiPackage}.${name}Api {\n\n`
		+ `\t${injectApi(group, 'api', ctx)}\n`
		+ `\tprivate ${ctx.root.apiSpiPackage}.ApiAuthorizationProvider authorizationProvider;\n\n`
		+ apiImplClassBodyText(group, ctx)

	const operations = group.operations.map(operation => operationMethod(operation, ctx)).join('')

	return `${header}${operations}`
		+ `\tpublic ${ctx.root.apiSpiPackage}.ApiAuthorizationProvider getAuthorizationProvider() {\n`
		+ '\t\treturn authorizationProvider;\n'
		+ '\t}\n\n'
		+ `\tpublic void setAuthorizationProvider(${ctx.root.apiSpiPackage}.ApiAuthorizationProvider authorizationProvider) {\n`
		+ '\t\tthis.authorizationProvider = authorizationProvider;\n'
		+ '\t}\n\n'
		+ '}\n'
}

function apiImplHeaderText(ctx: ClientContext): string {
	const header = ctx.templates.apiImplHeader(ctx)
	return typeof header === 'string' ? `${header}\n` : ''
}

function apiImplClassBodyText(group: CodegenOperationGroup, ctx: ClientContext): string {
	const body = ctx.templates.apiImplClassBody(group, ctx)
	return typeof body === 'string' ? `\t${body}\n` : ''
}
