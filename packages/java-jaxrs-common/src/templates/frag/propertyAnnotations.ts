import { CodegenProperty } from '@openapi-generator-plus/types'
import { join, maybe, when, stringLiteral, SKIP, Skip } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from '../types'

/** The `@Schema` annotation describing a model property for OpenAPI/Swagger. */
export function propertyAnnotations(property: CodegenProperty, ctx: JavaModelContext): string {
	const example: string | Skip = property.examples?.java
		? `example = ${property.examples.java.valueString}`
		: property.examples?.default
			? `example = ${property.examples.default.valueString}`
			: SKIP

	const props = join([
		`name = ${stringLiteral(ctx.generatorContext, property.serializedName)}`,
		maybe(property.description, d => `description = ${stringLiteral(ctx.generatorContext, d)}`),
		`requiredMode = io.swagger.v3.oas.annotations.media.Schema.RequiredMode.${property.required ? 'REQUIRED' : 'NOT_REQUIRED'}`,
		when(property.deprecated, 'deprecated = true'),
		example,
	], ', ')

	return `@io.swagger.v3.oas.annotations.media.Schema(${props})`
}
