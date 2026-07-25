import { CodegenObjectSchema, CodegenInterfaceSchema, CodegenSchemaInfo, CodegenProperty } from '@openapi-generator-plus/types'
import { join, maybe, when, stringLiteral, SKIP } from '@openapi-generator-plus/template-utils'
import { JavaJaxrsTemplates, JavaModelContext } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { pom } from './pom'

function pojoPropertyAnnotations(property: CodegenProperty, ctx: JavaModelContext): string {
	const access = property.readOnly
		? ', access = com.fasterxml.jackson.annotation.JsonProperty.Access.READ_ONLY'
		: property.writeOnly
			? ', access = com.fasterxml.jackson.annotation.JsonProperty.Access.WRITE_ONLY'
			: ''
	return `@com.fasterxml.jackson.annotation.JsonProperty(value = ${stringLiteral(ctx.generatorContext, property.serializedName)}${access})`
}

function pojoHeaderAnnotations(schema: CodegenObjectSchema | CodegenInterfaceSchema, ctx: JavaModelContext): string {
	const props = join([
		maybe(schema.serializedName, n => `name = ${stringLiteral(ctx.generatorContext, n)}`),
		maybe(schema.description, d => `description = ${stringLiteral(ctx.generatorContext, d)}`),
		schema.discriminator ? `discriminatorProperty = ${stringLiteral(ctx.generatorContext, schema.discriminator.serializedName)}` : SKIP,
		when(schema.deprecated, 'deprecated = true'),
	], ', ')
	return `@io.swagger.v3.oas.annotations.media.Schema(${props})`
}

/** The bean-validation groups a constraint applies to, derived from whether the target is read-only, write-only, or neither. */
function beanValidationAnnotationProperties(target: CodegenSchemaInfo, ctx: JavaModelContext): string {
	const validationPackage = ctx.root.validationPackage
	const groups: string[] = []
	if (target.readOnly || target.writeOnly) {
		if (target.writeOnly) {
			groups.push(`${validationPackage}.Request.class`)
		}
		if (target.readOnly) {
			groups.push(`${validationPackage}.Response.class`)
		}
	} else {
		groups.push(`${validationPackage}.Request.class`, `${validationPackage}.Response.class`)
	}
	return `groups = { ${groups.join(', ')} }`
}

/**
 * This generator's overrides of the model-emission hooks from `java-jaxrs-generator-common`,
 * plus its own `pom.xml` template (`java-jaxrs-generator-common` has no Maven template of
 * its own; see {@link JavaJaxrsTemplates.pom}).
 */
export const hooks: Partial<JavaJaxrsTemplates> = {
	pojoPropertyAnnotations,
	pojoHeaderAnnotations,
	beanValidationAnnotationProperties,
	pom,
}
