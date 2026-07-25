import { CodegenSchema } from '@openapi-generator-plus/types'
import { join, SKIP, Skip } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from '../types'
import { javax } from '../helpers'

/**
 * Extra annotation properties shared by every bean-validation constraint
 * applied to `schema`: an `Unwrapping` payload when the schema is nullable,
 * plus whatever the `beanValidationAnnotationProperties` hook contributes.
 * Renders SKIP when neither applies.
 */
export function beanValidationAnnotationProperties(schema: CodegenSchema, ctx: JavaModelContext): string | Skip {
	const parts: (string | Skip)[] = []
	if (schema.nullable) {
		parts.push(`payload = ${javax(ctx.root.useJakarta)}.validation.valueextraction.Unwrapping.Unwrap.class`)
	}
	parts.push(ctx.templates.beanValidationAnnotationProperties(schema, ctx))
	return join(parts, ', ')
}
