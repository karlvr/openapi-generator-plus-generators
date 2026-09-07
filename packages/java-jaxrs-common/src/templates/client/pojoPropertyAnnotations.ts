import { CodegenProperty } from '@openapi-generator-plus/types'
import { stringLiteral } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from '../types'

/**
 * The `@JsonProperty` annotation of a model property, in the form that a client needs.
 *
 * A client sends a request and reads a response, so it uses each access mode in the opposite
 * direction from a server. A `writeOnly` property in OpenAPI appears only in a request, which
 * a client only serializes, and Jackson calls that `READ_ONLY`. A `readOnly` property is the
 * mirror of it.
 *
 * Use this in the `pojoPropertyAnnotations` hook of a client generator.
 */
export function clientPojoPropertyAnnotations(property: CodegenProperty, ctx: JavaModelContext): string {
	const access = property.writeOnly
		? ', access = com.fasterxml.jackson.annotation.JsonProperty.Access.READ_ONLY'
		: property.readOnly
			? ', access = com.fasterxml.jackson.annotation.JsonProperty.Access.WRITE_ONLY'
			: ''
	return `@com.fasterxml.jackson.annotation.JsonProperty(value = ${stringLiteral(ctx.generatorContext, property.serializedName)}${access})`
}
