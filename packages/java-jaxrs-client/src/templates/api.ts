import { CodegenContent, CodegenOperation, CodegenOperationGroup, CodegenResponse } from '@openapi-generator-plus/types'
import { ts, each, when, indent, indentTail, className, identifier, md, nonDefaultResponses, responseContentAndNone } from '@openapi-generator-plus/template-utils'
import { imports, operationVars, operationDocumentation, generatedAnnotation } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { ClientContext } from './types'
import { bodyParam } from './frag/bodyParam'
import { operationReturnType, responseClassBody, responseClassName, responseMembers, responseWrapper, responseWrapperClass } from './frag/responseClass'

/** One response content variant's exception class name: `{Operation}_{code}[MediaType]Exception` — the media-type suffix disambiguates a response with more than one content type. */
export function exceptionName(operation: CodegenOperation, response: CodegenResponse, mediaType: string | null, isFirst: boolean, ctx: ClientContext): string {
	const suffix = isFirst ? '' : className(ctx.generatorContext.generator(), mediaType ?? '')
	return `${responseClassName(operation, response, ctx)}${suffix}Exception`
}

/** One operation's high-level method declaration, throwing `UnexpectedApiException` plus one exception type per non-default response content variant. */
function operationMethod(operation: CodegenOperation, group: CodegenOperationGroup, ctx: ClientContext): string {
	const { parameters } = operationVars(operation, { jaxrs: false, service: false }, bodyParam, ctx)
	const returnType = operationReturnType(operation, group, ctx)

	const exceptionNames = nonDefaultResponses(operation).flatMap(response =>
		responseContentAndNone(response).map((entry, i) => exceptionName(operation, response, entry.content?.mediaType.mediaType ?? null, i === 0, ctx)))
	const throwsClause = `${ctx.root.apiPackage}.UnexpectedApiException${exceptionNames.map(name => `, ${name}`).join('')}`

	return ts`
	${operationDocumentation(operation)}
	${when(operation.deprecated, '@java.lang.Deprecated')}
	${returnType} ${identifier(ctx.generatorContext.generator(), operation.name)}(${parameters}) throws ${throwsClause};
`
}

/**
 * The constructor and accessor(s) for one exception class, at column 0 — the caller indents
 * it to the class body's column. Ends in exactly one newline (no trailing blank line): the
 * caller's own template supplies the blank line before the class's closing brace, so this
 * fragment doesn't also bake one in (which would double it up).
 */
function exceptionClassBody(name: string, response: CodegenResponse, content: CodegenContent | null, operation: CodegenOperation, ctx: ClientContext): string {
	return responseClassBody(name, responseMembers(response, content, 'entity', 'getEntity', operation, ctx))
}

/** A non-default response's documentation comment, at column 0 — the caller aligns it to the class declaration's column. */
function exceptionDocumentation(response: CodegenResponse): string {
	return ts`
/**
 * ${indentTail(md(response.description), ' * ')}
 */`
}

/** One non-default response content variant's generated exception class. */
function exceptionClass(operation: CodegenOperation, response: CodegenResponse, content: CodegenContent | null, isFirst: boolean, ctx: ClientContext): string {
	const name = exceptionName(operation, response, content?.mediaType.mediaType ?? null, isFirst, ctx)

	return ts`
	${exceptionDocumentation(response)}
	class ${name} extends java.lang.Exception {

		private static final long serialVersionUID = 1L;

${indent(exceptionClassBody(name, response, content, operation, ctx), '\t\t')}
	}

`
}

/** The exception classes generated for all of `operation`'s non-default responses (one per response content variant). */
function operationExceptionClasses(operation: CodegenOperation, ctx: ClientContext): string {
	return nonDefaultResponses(operation).map(response =>
		responseContentAndNone(response).map((entry, i) =>
			exceptionClass(operation, response, entry.content, i === 0, ctx)).join(''),
	).join('')
}

/** The class that carries the default response of `operation`, when that response declares headers; empty otherwise. */
function operationResponseWrapperClass(operation: CodegenOperation, group: CodegenOperationGroup, ctx: ClientContext): string {
	const wrapper = responseWrapper(operation, group, ctx)
	return wrapper ? responseWrapperClass(wrapper, operation, ctx) : ''
}

/**
 * The high-level, exception-throwing `Api` interface a caller programs against: one method
 * per operation (using plain return types and checked exceptions rather than JAX-RS
 * `Response`), plus the response classes those methods return when a default response
 * declares headers, and the exception classes those methods throw. The generated `ApiImpl`
 * invokes the low-level `ApiSpec` and translates its JAX-RS responses into these.
 */
export function api(group: CodegenOperationGroup, ctx: ClientContext): string {
	const name = className(ctx.generatorContext.generator(), group.name)

	const methods = each(group.operations, operation => operationMethod(operation, group, ctx), '')
	const methodsText = typeof methods === 'string' ? methods.replace(/\n+$/, '\n') : ''

	const responseWrapperClasses = group.operations.map(operation => operationResponseWrapperClass(operation, group, ctx)).join('')
	const exceptionClasses = group.operations.map(operation => operationExceptionClasses(operation, ctx)).join('')

	const header = ts`
package ${ctx.root.apiPackage};

${imports(ctx.root)}
/**
 * API client interface with high-level return types and exceptions. The implementation of this interface invokes the JAX-RS API client.
 *
 */
${generatedAnnotation(ctx.root)}
public interface ${name}Api extends ${ctx.root.apiPackage}.ApiInvoker {

`
	/*
	 * Assembled by plain concatenation, not further `ts` interpolation: `methodsText` ends
	 * in exactly one newline (no blank line), so the blank line separating it from the
	 * nested classes is added explicitly here (unconditional, matching the original);
	 * `responseWrapperClasses` and `exceptionClasses` (each of which ends in its own
	 * trailing blank line when non-empty) follow directly, then the interface's closing brace.
	 */
	return `${header}${methodsText}\n${responseWrapperClasses}${exceptionClasses}}\n`
}
