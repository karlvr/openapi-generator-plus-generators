import { CodegenOperation, CodegenOperationGroup, CodegenParameter } from '@openapi-generator-plus/types'
import * as idx from '@openapi-generator-plus/indexed-type'
import { ts, each, when, identifier, className } from '@openapi-generator-plus/template-utils'
import { JavaModelContext, imports, generatedAnnotation } from '@openapi-generator-plus/java-jaxrs-generator-common'

/** One query parameter's Retrofit annotation and declaration, or `''` if `parameter` isn't a query parameter. */
function queryParamDeclaration(parameter: CodegenParameter, ctx: JavaModelContext): string {
	if (!parameter.isQueryParam) {
		return ''
	}
	return `@retrofit2.http.Query("${parameter.name}") ${parameter.nativeType} ${identifier(ctx.generatorContext.generator(), parameter.name)}`
}

/**
 * One path parameter's Retrofit annotation and declaration, or `''` if `parameter` isn't a path
 * parameter. Uses the parameter's raw name for the Java variable, not an escaped identifier —
 * matching the original template exactly.
 */
function pathParamDeclaration(parameter: CodegenParameter): string {
	if (!parameter.isPathParam) {
		return ''
	}
	return `@retrofit2.http.Path("${parameter.name}") ${parameter.nativeType} ${parameter.name}`
}

/** One header parameter's Retrofit annotation and declaration, or `''` if `parameter` isn't a header parameter. */
function headerParamDeclaration(parameter: CodegenParameter, ctx: JavaModelContext): string {
	if (!parameter.isHeaderParam) {
		return ''
	}
	return `@retrofit2.http.Header("${parameter.name}") ${parameter.nativeType} ${identifier(ctx.generatorContext.generator(), parameter.name)}`
}

/**
 * One form parameter's Retrofit annotation and declaration, or `''` if `parameter` isn't a form
 * parameter. `@FormUrlEncoded` isn't Retrofit's usual per-field form annotation (`@Field` is) —
 * preserved as-is, matching the original (untested) template.
 */
function formParamDeclaration(parameter: CodegenParameter, ctx: JavaModelContext): string {
	if (!parameter.isFormParam) {
		return ''
	}
	return `@retrofit2.http.FormUrlEncoded("${parameter.name}") ${parameter.nativeType} ${identifier(ctx.generatorContext.generator(), parameter.name)}`
}

/**
 * One parameter's declaration within an operation's method signature. Exactly one of the
 * query/path/header/form annotations applies to any given parameter — a cookie parameter
 * matches none of them (Retrofit has no cookie-parameter annotation) and renders nothing,
 * so it is omitted from the signature entirely.
 */
function parameterDeclaration(parameter: CodegenParameter, ctx: JavaModelContext): string {
	return queryParamDeclaration(parameter, ctx)
		|| pathParamDeclaration(parameter)
		|| headerParamDeclaration(parameter, ctx)
		|| formParamDeclaration(parameter, ctx)
}

/** The operation's full parameter list, as it appears within its method signature's parentheses. */
function operationParameters(operation: CodegenOperation, ctx: JavaModelContext): string {
	const parameters = operation.parameters ? idx.allValues(operation.parameters) : []
	const declarations = parameters.map(parameter => parameterDeclaration(parameter, ctx)).filter(declaration => declaration !== '')

	if (operation.requestBody?.nativeType) {
		declarations.push(`@retrofit2.http.Body ${operation.requestBody.nativeType} ${operation.requestBody.name}`)
	}
	return declarations.join(', ')
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
	const methodAnnotation = operation.path
		? `@retrofit2.http.${operation.httpMethod}("${operation.path}")`
		: `@retrofit2.http.${operation.httpMethod}`
	const returnType = operation.returnNativeType ? `retrofit2.Call<${operation.returnNativeType}>` : 'retrofit2.Call<Void>'

	return ts`
	${methodAnnotation}
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
