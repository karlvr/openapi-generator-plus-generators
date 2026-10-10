import { CodegenArraySchema, CodegenContent, CodegenContentPropertyEncoding, CodegenOperation, CodegenOperationGroup, CodegenResponse } from '@openapi-generator-plus/types'
import * as idx from '@openapi-generator-plus/indexed-type'
import { indent, isArray, isContentMultipart, identifier, className, stringLiteral, nonDefaultResponses, nonDefaultAndCatchAllResponses, responseContentAndNone, SKIP, Skip } from '@openapi-generator-plus/template-utils'
import { imports, operationVars, generatedAnnotation, javax, getter } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { ClientContext } from './types'
import { bodyParam } from './frag/bodyParam'
import { exceptionName } from './api'
import { operationReturnType, responseClassBuilding, responseMembers, responseWrapper, ResponseWrapper, RESPONSE_VAR } from './frag/responseClass'

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

/**
 * The multipart request body this operation sends, built into `__multipartBody`. SKIP
 * (rendering nothing) when the operation's request body isn't multipart.
 */
function multipartBuilding(operation: CodegenOperation, ctx: ClientContext): string | Skip {
	const requestBody = operation.requestBody
	if (!requestBody || !isContentMultipart(requestBody.defaultContent)) {
		return SKIP
	}
	return ctx.templates.multipartBodyBuilding(requestBody, ctx)
}

/**
 * The response's contents, dispatched on the media type that the response carries, each
 * throwing its own exception class.
 *
 * Use this where the response is in scope under the name that `RESPONSE_VAR` gives.
 */
function mediaTypeDispatchBlock(operation: CodegenOperation, response: CodegenResponse, ctx: ClientContext): string {
	const jx = javax(ctx.root.useJakarta)
	const contents = response.contents ?? []

	const throwLines = responseContentAndNone(response).map((entry, i) => {
		const name = exceptionName(operation, response, entry.content?.mediaType.mediaType ?? null, i === 0, ctx)
		const members = responseMembers(response, entry.content, 'entity', 'getEntity', operation, ctx)
		const building = responseClassBuilding(name, members)
		if (!entry.content) {
			/* Nothing reads a body, so the response is closed once its headers are read */
			return `${building.statements}${RESPONSE_VAR}.close();\nthrow ${building.expression};\n`
		}
		const thrown = `${building.statements}throw ${building.expression};\n`
		return `if (${RESPONSE_VAR}.getMediaType() != null && ${RESPONSE_VAR}.getMediaType().isCompatible(${jx}.ws.rs.core.MediaType.valueOf(${stringLiteral(ctx.generatorContext, entry.content.mediaType.mediaType)}))) {\n${indent(thrown, '\t')}}\n`
	}).join('')

	/* A response that declares no content throws unconditionally above, so nothing follows it */
	if (contents.length === 0) {
		return throwLines
	}

	const unsupportedMediaType = `throw new ${ctx.root.apiPackage}.UnprocessableResponseException(${RESPONSE_VAR}, new ${jx}.ws.rs.ProcessingException("Unsupported media type for response status " + ${RESPONSE_VAR}.getStatus() + ": " + ${RESPONSE_VAR}.getMediaType()));\n`

	return 'try {\n'
		+ indent(`${throwLines}\n${unsupportedMediaType}`, '\t')
		+ `} catch (${jx}.ws.rs.ProcessingException __processingException) {\n`
		+ `\tthrow new ${ctx.root.apiPackage}.UnprocessableResponseException(${RESPONSE_VAR}, __processingException);\n`
		+ '}\n'
}

/** One non-default, non-catch-all response's gate: matches its status code, then dispatches on media type. */
function nonDefaultStatusBlock(operation: CodegenOperation, response: CodegenResponse, ctx: ClientContext): string {
	return `if (__status == ${String(response.code)}) {\n${indent(mediaTypeDispatchBlock(operation, response, ctx), '\t')}}\n`
}

/**
 * What the operation gives a caller for its default response: the body, the wrapper that
 * carries the body and the declared headers, or nothing.
 */
function defaultResponseBlock(operation: CodegenOperation, wrapper: ResponseWrapper | null, ctx: ClientContext): string {
	const jx = javax(ctx.root.useJakarta)

	const building = wrapper ? responseClassBuilding(wrapper.nativeType, wrapper.members) : null
	/* A wrapper without a body reads nothing from the response after its headers, so it closes the response first */
	const closeBeforeWrapper = operation.defaultResponse?.defaultContent?.nativeType ? '' : `${RESPONSE_VAR}.close();\n`
	const body = building
		? `${building.statements}${closeBeforeWrapper}return ${building.expression};\n`
		: operation.returnNativeType && operation.defaultResponse?.defaultContent?.nativeType
			? `return ${RESPONSE_VAR}.readEntity(${operation.defaultResponse.defaultContent.nativeType.literalType}.class);\n`
			: `${RESPONSE_VAR}.close();\n`

	/*
	 * A response that declares content, but that carries none, broke the contract that the
	 * API states. The client has no model to give, so it reports that rather than a success
	 * that carries null.
	 */
	const requiresEntity = operation.defaultResponse?.defaultContent?.nativeType
		? `if (!${RESPONSE_VAR}.hasEntity()) {\n`
			+ `\tthrow new ${ctx.root.apiPackage}.UnprocessableResponseException(${RESPONSE_VAR}, new ${jx}.ws.rs.ProcessingException("No body for response status " + ${RESPONSE_VAR}.getStatus() + ", which declares " + ${stringLiteral(ctx.generatorContext, `${operation.defaultResponse.defaultContent.mediaType.mediaType}`)}));\n`
			+ '}\n'
		: ''

	/* A body that the client cannot parse is a failure of this response, not of another one */
	return requiresEntity
		+ 'try {\n'
		+ indent(body, '\t')
		+ `} catch (${jx}.ws.rs.ProcessingException __processingException) {\n`
		+ `\tthrow new ${ctx.root.apiPackage}.UnprocessableResponseException(${RESPONSE_VAR}, __processingException);\n`
		+ '}\n'
}

/**
 * `block`, gated so that it runs for every status apart from the one that the operation's
 * default response documents. Returns `block` unchanged when the operation documents no
 * default response, because every status then belongs to `block`.
 */
function gatedByOtherThanDefault(operation: CodegenOperation, block: string): string {
	const code = operation.defaultResponse?.code
	if (typeof code !== 'number') {
		return block
	}
	return `if (__status != ${String(code)}) {\n${indent(block, '\t')}}\n`
}

/**
 * The private method that turns the JAX-RS `Response` of a call into what the operation
 * gives a caller, throwing the exception of whichever response the status names.
 *
 * A status that no response documents, and that is not a success, becomes an
 * `UnexpectedResponseException` carrying the response, so a caller can still read it.
 */
function responseHandlerMethod(operation: CodegenOperation, wrapper: ResponseWrapper | null, returnType: string, throwsClause: string, ctx: ClientContext): string {
	const generator = ctx.generatorContext.generator()
	const jx = javax(ctx.root.useJakarta)

	const statusBlocks = nonDefaultAndCatchAllResponses(operation).map(response => nonDefaultStatusBlock(operation, response, ctx)).join('')

	/*
	 * A catch-all response covers every status that no other response documents, so it
	 * covers everything the blocks above left, apart from the default response's own status.
	 * A catch-all that is itself the default response documents no other status, so it gets
	 * no block of its own.
	 */
	const catchAll = operation.catchAllResponse && operation.catchAllResponse !== operation.defaultResponse
		? `/* Catch-all response */\n${gatedByOtherThanDefault(operation, mediaTypeDispatchBlock(operation, operation.catchAllResponse, ctx))}`
		: `if (__status >= 300) {\n\tthrow new ${ctx.root.apiPackage}.UnexpectedResponseException(${RESPONSE_VAR}, new ${jx}.ws.rs.WebApplicationException(${RESPONSE_VAR}));\n}\n`

	const body = `int __status = ${RESPONSE_VAR}.getStatus();\n`
		+ statusBlocks
		+ catchAll
		+ defaultResponseBlock(operation, wrapper, ctx)

	return `\t/** What {@code ${identifier(generator, operation.name)}} gives a caller for {@code ${RESPONSE_VAR}}, by the status that it carries. */\n`
		+ `\tprivate ${returnType} ${responseHandlerName(operation, ctx)}(${jx}.ws.rs.core.Response ${RESPONSE_VAR}) throws ${throwsClause} {\n`
		+ indent(body, '\t\t')
		+ '\t}\n\n'
}

/** The name of the private method that turns one operation's `Response` into what it gives a caller. */
function responseHandlerName(operation: CodegenOperation, ctx: ClientContext): string {
	return `__handle${className(ctx.generatorContext.generator(), operation.name)}`
}

/** One operation's JAX-RS implementation method, invoking the low-level `ApiSpec` and translating its responses into this API's exceptions. */
function operationMethod(operation: CodegenOperation, group: CodegenOperationGroup, ctx: ClientContext): string {
	const generator = ctx.generatorContext.generator()
	const jx = javax(ctx.root.useJakarta)
	const { parameters, arguments: baseArgs } = operationVars(operation, { jaxrs: false, service: false }, bodyParam, ctx)
	const isMultipart = !!operation.requestBody && isContentMultipart(operation.requestBody.defaultContent)
	/* A multipart request body is sent as `__multipartBody`, not the request body's own variable — recomputed here to match. */
	const callArgs = isMultipart
		? operationVars(operation, { jaxrs: false, service: false, requestBodyVar: '__multipartBody' }, bodyParam, ctx).arguments
		: baseArgs

	const wrapper = responseWrapper(operation, group, ctx)
	const returnType = operationReturnType(operation, group, ctx)
	const exceptionNames = nonDefaultResponses(operation).flatMap(response =>
		responseContentAndNone(response).map((entry, i) => exceptionName(operation, response, entry.content?.mediaType.mediaType ?? null, i === 0, ctx)))
	const throwsClause = `${ctx.root.apiPackage}.UnexpectedApiException${exceptionNames.map(name => `, ${name}`).join('')}`

	const invocation = `api.${identifier(generator, operation.name)}(${callArgs})`

	const authorizeBlock = operation.securityRequirements ? 'if (authorizationProvider != null) {\n\tauthorizationProvider.authorize(this);\n}\n\n' : ''

	const multipart = multipartBuilding(operation, ctx)
	const multipartText = typeof multipart === 'string' ? `${multipart}\n` : ''

	/* An unauthorized response asks the provider for a new credential, then repeats the call once */
	const reauthorizeBlock = operation.securityRequirements
		? `if (${RESPONSE_VAR}.getStatus() == 401 && authorizationProvider != null) {\n`
			+ `\tif (authorizationProvider.reauthorize(this, ${RESPONSE_VAR})) {\n`
			+ `\t\t${RESPONSE_VAR}.close();\n`
			+ `\t\t${RESPONSE_VAR} = ${invocation};\n`
			+ '\t}\n'
			+ '}\n'
		: ''

	const tryBody = `${jx}.ws.rs.core.Response ${RESPONSE_VAR} = ${invocation};\n`
		+ reauthorizeBlock
		+ `${operation.returnNativeType || wrapper ? 'return ' : ''}${responseHandlerName(operation, ctx)}(${RESPONSE_VAR});\n`

	const deprecatedLine = operation.deprecated ? '\t@java.lang.SuppressWarnings("deprecation")\n' : ''

	return `\t@java.lang.Override\n${deprecatedLine}\tpublic ${returnType} ${identifier(generator, operation.name)}(${parameters}) throws ${throwsClause} {\n`
		+ indent(authorizeBlock + multipartText, '\t\t')
		+ '\t\ttry {\n'
		+ indent(tryBody, '\t\t\t')
		+ `\t\t} catch (${jx}.ws.rs.client.ResponseProcessingException __e) {\n`
		+ `\t\t\tthrow new ${ctx.root.apiPackage}.UnprocessableResponseException(__e.getResponse(), __e);\n`
		+ `\t\t} catch (${jx}.ws.rs.ProcessingException __e) {\n`
		+ '\t\t\tif (__e.getCause() instanceof java.net.SocketTimeoutException) {\n'
		+ `\t\t\t\tthrow new ${ctx.root.apiPackage}.UnexpectedTimeoutException((java.net.SocketTimeoutException) __e.getCause());\n`
		+ '\t\t\t}\n'
		+ `\t\t\tthrow new ${ctx.root.apiPackage}.UnexpectedApiProcessingException(__e);\n`
		+ '\t\t}\n'
		+ '\t}\n\n'
		+ responseHandlerMethod(operation, wrapper, returnType, throwsClause, ctx)
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

	const operations = group.operations.map(operation => operationMethod(operation, group, ctx)).join('')

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
