import { CodegenRequestBody } from '@openapi-generator-plus/types'
import { join, maybe, when, stringLiteral, isContentMultipart, identifier } from '@openapi-generator-plus/template-utils'
import { OperationVarsOptions, JavaModelContext } from '@openapi-generator-plus/java-jaxrs-generator-common'

/**
 * A request body's own parameter declaration: its Swagger `@Parameter` annotation (if
 * `jaxrs`), then either the CXF multipart-body parameter (for a multipart request body,
 * on the JAX-RS implementation method) or its own native type and name.
 */
export function bodyParam(requestBody: CodegenRequestBody, opts: OperationVarsOptions, ctx: JavaModelContext): string {
	const annotation = opts.jaxrs
		? `@io.swagger.v3.oas.annotations.Parameter(${join([
			maybe(requestBody.description, d => `description = ${stringLiteral(ctx.generatorContext, d)}`),
			when(requestBody.required, 'required = true'),
			when(requestBody.deprecated, 'deprecated = true'),
		], ', ')}) `
		: ''

	const declaration = isContentMultipart(requestBody.defaultContent) && ctx.root.serverGenerator && !opts.service
		? 'org.apache.cxf.jaxrs.ext.multipart.MultipartBody __multipartBody'
		: `${requestBody.nativeType} ${identifier(ctx.generatorContext.generator(), requestBody.name)}`

	return `${annotation}${declaration}`
}
