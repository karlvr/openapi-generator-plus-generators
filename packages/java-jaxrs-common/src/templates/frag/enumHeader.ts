import { CodegenEnumSchema } from '@openapi-generator-plus/types'
import { join, when, maybe, stringLiteral, className, SKIP, Skip } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from '../types'

/**
 * The `@Schema`, `@XmlRootElement`, `@XmlType` and `@XmlEnum` annotations for
 * an enum declaration, plus the `enumHeaderAnnotations` hook and a
 * `@Deprecated` annotation when applicable. Never actually SKIPs (the
 * `@Schema`/`@XmlType`/`@XmlEnum` lines are unconditional) but is typed to
 * match the other header fragments it's composed alongside.
 */
export function enumHeader(schema: CodegenEnumSchema, ctx: JavaModelContext): string | Skip {
	const jx = ctx.root.useJakarta ? 'jakarta' : 'javax'
	const schemaProps = join([
		schema.serializedName ? `name = ${stringLiteral(ctx.generatorContext, schema.serializedName)}` : SKIP,
		schema.serializedName ? 'enumAsRef = true' : SKIP,
		maybe(schema.description, d => `description = ${stringLiteral(ctx.generatorContext, d)}`),
		when(schema.deprecated, 'deprecated = true'),
	], ', ')

	return join([
		ctx.templates.enumHeaderAnnotations(schema, ctx),
		`@io.swagger.v3.oas.annotations.media.Schema(${schemaProps})`,
		schema.serializedName ? `@${jx}.xml.bind.annotation.XmlRootElement(name = ${stringLiteral(ctx.generatorContext, schema.serializedName)})` : SKIP,
		`@${jx}.xml.bind.annotation.XmlType(name = "${className(ctx.generatorContext.generator(), schema.name)}")`,
		`@${jx}.xml.bind.annotation.XmlEnum(${schema.enumValueNativeType}.class)`,
		schema.deprecated ? '@java.lang.Deprecated' : SKIP,
	], '\n')
}
