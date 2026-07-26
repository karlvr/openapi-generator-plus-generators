import { CodegenOperation, CodegenOperationGroup, CodegenResponse } from '@openapi-generator-plus/types'
import { ts, each, when, indent, indentTail, className, identifier, md, nonDefaultResponses, responseContentAndNone } from '@openapi-generator-plus/template-utils'
import { imports, operationVars, operationDocumentation, generatedAnnotation } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { ClientContext } from './types'
import { bodyParam } from './frag/bodyParam'

/** One response content variant's exception class name: `{Operation}_{code}[MediaType]Exception` — the media-type suffix disambiguates a response with more than one content type. */
export function exceptionName(operation: CodegenOperation, response: CodegenResponse, mediaType: string | null, isFirst: boolean, ctx: ClientContext): string {
	const generator = ctx.generatorContext.generator()
	const base = className(generator, `${operation.name}_${String(response.code)}`)
	const suffix = isFirst ? '' : className(generator, mediaType ?? '')
	return `${base}${suffix}Exception`
}

/** One operation's high-level method declaration, throwing `UnexpectedApiException` plus one exception type per non-default response content variant. */
function operationMethod(operation: CodegenOperation, ctx: ClientContext): string {
	const { parameters } = operationVars(operation, { jaxrs: false, service: false }, bodyParam, ctx)
	const returnType = operation.returnNativeType ? `${operation.returnNativeType}` : 'void'

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
function exceptionClassBody(name: string, entityType: string | null): string {
	if (!entityType) {
		return `public ${name}() {

}
`
	}
	return `private ${entityType} entity;

public ${name}(${entityType} entity) {
	this.entity = entity;
}

public ${entityType} getEntity() {
	return this.entity;
}
`
}

/** A non-default response's documentation comment, at column 0 — the caller aligns it to the class declaration's column. */
function exceptionDocumentation(response: CodegenResponse): string {
	return ts`
/**
 * ${indentTail(md(response.description), ' * ')}
 */`
}

/** One non-default response content variant's generated exception class. */
function exceptionClass(operation: CodegenOperation, response: CodegenResponse, mediaType: string | null, entityType: string | null, isFirst: boolean, ctx: ClientContext): string {
	const name = exceptionName(operation, response, mediaType, isFirst, ctx)

	return ts`
	${exceptionDocumentation(response)}
	class ${name} extends java.lang.Exception {

		private static final long serialVersionUID = 1L;

${indent(exceptionClassBody(name, entityType), '\t\t')}
	}

`
}

/** The exception classes generated for all of `operation`'s non-default responses (one per response content variant). */
function operationExceptionClasses(operation: CodegenOperation, ctx: ClientContext): string {
	return nonDefaultResponses(operation).map(response =>
		responseContentAndNone(response).map((entry, i) =>
			exceptionClass(operation, response, entry.content?.mediaType.mediaType ?? null, entry.content?.nativeType ? `${entry.content.nativeType}` : null, i === 0, ctx)).join(''),
	).join('')
}

/**
 * The high-level, exception-throwing `Api` interface a caller programs against: one method
 * per operation (using plain return types and checked exceptions rather than JAX-RS
 * `Response`), plus the exception classes those methods throw. The generated `ApiImpl`
 * invokes the low-level `ApiSpec` and translates its JAX-RS responses into these.
 */
export function api(group: CodegenOperationGroup, ctx: ClientContext): string {
	const name = className(ctx.generatorContext.generator(), group.name)

	const methods = each(group.operations, operation => operationMethod(operation, ctx), '')
	const methodsText = typeof methods === 'string' ? methods.replace(/\n+$/, '\n') : ''

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
	 * exception classes is added explicitly here (unconditional, matching the original);
	 * `exceptionClasses` (which itself ends in its own trailing blank line when non-empty)
	 * follows directly, then the interface's closing brace.
	 */
	return `${header}${methodsText}\n${exceptionClasses}}\n`
}
