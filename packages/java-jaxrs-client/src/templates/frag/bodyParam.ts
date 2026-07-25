import { CodegenContentEncodingType, CodegenRequestBody } from '@openapi-generator-plus/types'
import { identifier } from '@openapi-generator-plus/template-utils'
import { OperationVarsOptions, JavaModelContext } from '@openapi-generator-plus/java-jaxrs-generator-common'

/**
 * A request body's own parameter declaration: for a JAX-RS interface method (the low-level
 * `ApiSpec`) whose request body is multipart, CXF's multipart-body parameter type; otherwise
 * its own native type and name. Unlike the server branch's `bodyParam`, this never adds a
 * Swagger `@Parameter` annotation to the request body — a pre-existing asymmetry in the
 * original template, ported faithfully.
 */
export function bodyParam(requestBody: CodegenRequestBody, opts: OperationVarsOptions, ctx: JavaModelContext): string {
	const name = identifier(ctx.generatorContext.generator(), requestBody.name)

	const declaration = opts.jaxrs && requestBody.defaultContent.encoding?.type === CodegenContentEncodingType.MULTIPART
		? 'org.apache.cxf.jaxrs.ext.multipart.MultipartBody'
		: `${requestBody.nativeType}`

	return `${declaration} ${name}`
}
