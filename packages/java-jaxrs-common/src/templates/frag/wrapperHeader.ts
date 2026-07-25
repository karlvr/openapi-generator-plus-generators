import { CodegenWrapperSchema } from '@openapi-generator-plus/types'
import { join, SKIP, Skip } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from '../types'

/**
 * The `wrapperHeaderAnnotations` hook, `@XmlRootElement` (if the schema has a
 * serialized name) and a `@Deprecated` annotation, for a wrapper class
 * declaration.
 */
export function wrapperHeader(schema: CodegenWrapperSchema, ctx: JavaModelContext): string | Skip {
	const jx = ctx.root.useJakarta ? 'jakarta' : 'javax'
	return join([
		ctx.templates.wrapperHeaderAnnotations(schema, ctx),
		/* NOTE: unlike pojoHeader/enumHeader, this uses the raw serializedName rather than stringLiteral — matching the original template exactly. */
		schema.serializedName ? `@${jx}.xml.bind.annotation.XmlRootElement(name = "${schema.serializedName}")` : SKIP,
		schema.deprecated ? '@java.lang.Deprecated' : SKIP,
	], '\n')
}
