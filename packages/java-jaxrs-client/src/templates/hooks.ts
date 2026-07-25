import { CodegenProperty } from '@openapi-generator-plus/types'
import { stringLiteral } from '@openapi-generator-plus/template-utils'
import { JavaJaxrsTemplates, JavaModelContext } from '@openapi-generator-plus/java-jaxrs-generator-common'

/**
 * Note that the concepts of readOnly and writeOnly are reversed for clients. A writeOnly
 * property in OpenAPI is one that is only sent in requests, while READ_ONLY access in
 * Jackson means a property that is only serialized (to send in a request or response).
 */
function pojoPropertyAnnotations(property: CodegenProperty, ctx: JavaModelContext): string {
	const access = property.writeOnly
		? ', access = com.fasterxml.jackson.annotation.JsonProperty.Access.READ_ONLY'
		: property.readOnly
			? ', access = com.fasterxml.jackson.annotation.JsonProperty.Access.WRITE_ONLY'
			: ''
	return `@com.fasterxml.jackson.annotation.JsonProperty(value = ${stringLiteral(ctx.generatorContext, property.serializedName)}${access})`
}

/** This generator's overrides of the model-emission hooks from `java-jaxrs-generator-common`. */
export const hooks: Partial<JavaJaxrsTemplates> = {
	pojoPropertyAnnotations,
}
