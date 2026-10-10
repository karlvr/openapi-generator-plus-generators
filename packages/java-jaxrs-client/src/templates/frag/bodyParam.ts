import { CodegenContentEncodingType, CodegenRequestBody } from '@openapi-generator-plus/types'
import { identifier } from '@openapi-generator-plus/template-utils'
import { javax, OperationVarsOptions, JavaModelContext } from '@openapi-generator-plus/java-jaxrs-generator-common'

/**
 * A request body's own parameter declaration.
 *
 * A JAX-RS interface method (the low-level `ApiSpec`) carries the type that JAX-RS writes: the
 * multipart body type that the generator's templates choose, or a `Form`. Every other method
 * carries the request body's own type, which is the model that a caller fills.
 *
 * Unlike the server branch's `bodyParam`, this never adds a Swagger `@Parameter` annotation to
 * the request body — a pre-existing asymmetry in the original template, ported faithfully.
 */
export function bodyParam(requestBody: CodegenRequestBody, opts: OperationVarsOptions, ctx: JavaModelContext): string {
	const name = identifier(ctx.generatorContext.generator(), requestBody.name)
	const encoding = requestBody.defaultContent.encoding?.type

	const declaration = !opts.jaxrs
		? `${requestBody.nativeType}`
		: encoding === CodegenContentEncodingType.MULTIPART
			? ctx.templates.multipartBodyType(ctx)
			: encoding === CodegenContentEncodingType.WWW_FORM_URLENCODED
				? `${javax(ctx.root.useJakarta)}.ws.rs.core.Form`
				: `${requestBody.nativeType}`

	return `${declaration} ${name}`
}
