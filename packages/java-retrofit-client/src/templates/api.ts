import { CodegenOperation, CodegenOperationGroup, CodegenParameter } from '@openapi-generator-plus/types'
import * as idx from '@openapi-generator-plus/indexed-type'
import { ts, each, when, identifier, className, stringLiteral, SKIP, Skip } from '@openapi-generator-plus/template-utils'
import { JavaModelContext, imports, generatedAnnotation } from '@openapi-generator-plus/java-jaxrs-generator-common'

/**
 * One parameter's declaration, under the Retrofit annotation that `annotation` names.
 *
 * The annotation carries the name that the API declares, because that is the name that the
 * request carries. The Java variable carries the name that the generator made safe.
 */
function annotatedDeclaration(annotation: string, parameter: CodegenParameter, ctx: JavaModelContext): string {
	const name = stringLiteral(ctx.generatorContext, parameter.serializedName)
	return `@retrofit2.http.${annotation}(${name}) ${parameter.nativeType} ${identifier(ctx.generatorContext.generator(), parameter.name)}`
}

/** One query parameter's Retrofit annotation and declaration, or `''` if `parameter` isn't a query parameter. */
function queryParamDeclaration(parameter: CodegenParameter, ctx: JavaModelContext): string {
	return parameter.isQueryParam ? annotatedDeclaration('Query', parameter, ctx) : ''
}

/** One path parameter's Retrofit annotation and declaration, or `''` if `parameter` isn't a path parameter. */
function pathParamDeclaration(parameter: CodegenParameter, ctx: JavaModelContext): string {
	return parameter.isPathParam ? annotatedDeclaration('Path', parameter, ctx) : ''
}

/** One header parameter's Retrofit annotation and declaration, or `''` if `parameter` isn't a header parameter. */
function headerParamDeclaration(parameter: CodegenParameter, ctx: JavaModelContext): string {
	return parameter.isHeaderParam ? annotatedDeclaration('Header', parameter, ctx) : ''
}

/** One form parameter's Retrofit annotation and declaration, or `''` if `parameter` isn't a form parameter. */
function formParamDeclaration(parameter: CodegenParameter, ctx: JavaModelContext): string {
	return parameter.isFormParam ? annotatedDeclaration('Field', parameter, ctx) : ''
}

/**
 * One parameter's declaration within an operation's method signature. Exactly one of the
 * query/path/header/form annotations applies to any given parameter — a cookie parameter
 * matches none of them (Retrofit has no cookie-parameter annotation) and renders nothing,
 * so it is omitted from the signature entirely.
 */
function parameterDeclaration(parameter: CodegenParameter, ctx: JavaModelContext): string {
	return queryParamDeclaration(parameter, ctx)
		|| pathParamDeclaration(parameter, ctx)
		|| headerParamDeclaration(parameter, ctx)
		|| formParamDeclaration(parameter, ctx)
}

/**
 * The operation's full parameter list, as it appears within its method signature's parentheses.
 *
 * A form body and a multipart body reach the request as a whole model, under `@Body`, the same
 * as a JSON body does. Retrofit's own `@Field` and `@Part` annotations describe one property
 * each, and neither carries the encoding styles that OpenAPI declares. The generated
 * `ApiConverterFactory` encodes the model instead.
 */
function operationParameters(operation: CodegenOperation, ctx: JavaModelContext): string {
	const parameters = operation.parameters ? idx.allValues(operation.parameters) : []
	const declarations = parameters.map(parameter => parameterDeclaration(parameter, ctx)).filter(declaration => declaration !== '')

	if (operation.requestBody?.nativeType) {
		declarations.push(`@retrofit2.http.Body ${operation.requestBody.nativeType} ${operation.requestBody.name}`)
	}
	return declarations.join(', ')
}

/**
 * Whether the operation declares an `Accept` header parameter. Header names are
 * case-insensitive, so the comparison ignores case.
 */
function hasAcceptHeaderParameter(operation: CodegenOperation): boolean {
	const parameters = operation.parameters ? idx.allValues(operation.parameters) : []
	return parameters.some(parameter => parameter.isHeaderParam && parameter.name.toLowerCase() === 'accept')
}

/**
 * The operation's Accept header annotation. The header lists the media types of the
 * operation's default response, in spec order and without duplicates.
 *
 * The list is not filtered by what the client can parse. Retrofit parses through a converter
 * factory that the caller supplies, so the generator cannot know what will succeed.
 *
 * SKIP when the default response declares no content. SKIP also when the operation declares
 * an `Accept` header parameter: the caller then owns the header. Retrofit adds header
 * parameters rather than replacing them, so both values would otherwise reach the server.
 */
function acceptHeaderAnnotation(operation: CodegenOperation, ctx: JavaModelContext): string | Skip {
	if (hasAcceptHeaderParameter(operation)) {
		return SKIP
	}

	const contents = operation.defaultResponse?.contents
	if (!contents || contents.length === 0) {
		return SKIP
	}

	const mimeTypes: string[] = []
	for (const content of contents) {
		const mimeType = content.mediaType.mimeType
		if (!mimeTypes.includes(mimeType)) {
			mimeTypes.push(mimeType)
		}
	}
	return `@retrofit2.http.Headers({ ${stringLiteral(ctx.generatorContext, `Accept: ${mimeTypes.join(', ')}`)} })`
}

/**
 * The annotation that makes Retrofit encode the operation's `@Field` parameters into a form
 * body. SKIP when the operation declares no form parameter.
 */
function formUrlEncodedAnnotation(operation: CodegenOperation): string | Skip {
	const parameters = operation.parameters ? idx.allValues(operation.parameters) : []
	return parameters.some(parameter => parameter.isFormParam) ? '@retrofit2.http.FormUrlEncoded' : SKIP
}

/**
 * The operation's path, in the form that Retrofit resolves against the base URL.
 *
 * Retrofit resolves a path that starts with "/" against the root of the host, which discards
 * any path that the base URL carries. A relative path keeps it, so a server URL such as
 * `https://example.com/api/v1/` reaches the operation.
 *
 * The base URL must end with "/" for this to work, which Retrofit itself requires.
 *
 * Retrofit takes an empty path to mean that the method has none, so the root of the base URL
 * is ".".
 */
function relativePath(operation: CodegenOperation): string {
	return operation.fullPath.replace(/^\//, '') || '.'
}

/**
 * One operation's Retrofit method declaration.
 *
 * The original template also rendered any nested models declared directly on the operation
 * (`{{#ifdef schemas}}{{>nestedModels}}{{/ifdef}}`) before the method — but `CodegenOperation`
 * has no `schemas` field, so that guard was always false and nothing ever rendered; omitted
 * here entirely rather than ported as permanently-dead code.
 */
function operationMethod(operation: CodegenOperation, ctx: JavaModelContext): string {
	const generator = ctx.generatorContext.generator()
	const methodAnnotation = `@retrofit2.http.${operation.httpMethod}(${stringLiteral(ctx.generatorContext, relativePath(operation))})`
	const returnType = operation.returnNativeType ? `retrofit2.Call<${operation.returnNativeType}>` : 'retrofit2.Call<Void>'

	return ts`
	${methodAnnotation}
	${formUrlEncodedAnnotation(operation)}
	${acceptHeaderAnnotation(operation, ctx)}
	${when(operation.deprecated, '@java.lang.Deprecated')}
	${returnType} ${identifier(generator, operation.name)}(${operationParameters(operation, ctx)});

`
}

/**
 * This client's whole `Api.java` interface for one operation group: one Retrofit-annotated
 * method per operation, using Retrofit's own `@retrofit2.http.*` request/parameter annotations
 * directly (rather than the family's shared JAX-RS-oriented operation rendering).
 */
export function api(group: CodegenOperationGroup, ctx: JavaModelContext): string {
	const generator = ctx.generatorContext.generator()
	const name = className(generator, group.name)

	const operationsText = each(group.operations, operation => operationMethod(operation, ctx), '')

	return ts`
package ${ctx.root.apiPackage};

${imports(ctx.root)}
${generatedAnnotation(ctx.root)}
public interface ${name}Api {

${operationsText}}
`
}
