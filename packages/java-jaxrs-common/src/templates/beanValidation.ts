import { CodegenProperty } from '@openapi-generator-plus/types'
import { isObject, isArray, isMap, join, stringLiteral, SKIP, Skip } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from './types'
import { javax } from './helpers'
import { beanValidationCore } from './beanValidationCore'

/**
 * The bean-validation annotations for a property: `@Valid` for nested
 * object/array/map values, `@NotNull` for required properties (unless
 * covered by a not-blank/not-empty constraint, or nullable), and the
 * constraint annotations implied by the property's own schema.
 */
export function beanValidation(property: CodegenProperty, ctx: JavaModelContext): string | Skip {
	const jx = javax(ctx.root.useJakarta)
	const lines: (string | Skip)[] = []

	if (isObject(property) || isArray(property) || isMap(property)) {
		lines.push(`@${jx}.validation.Valid`)
	}

	const schema = property.schema
	if (property.required && !schema.vendorExtensions?.['x-not-blank'] && !schema.vendorExtensions?.['x-not-empty'] && !property.nullable) {
		const requiredMessageValue = schema.vendorExtensions?.['x-required-message']
		const requiredMessage = requiredMessageValue !== undefined
			? `message = ${stringLiteral(ctx.generatorContext, String(requiredMessageValue))}`
			: SKIP
		const props = join([requiredMessage, ctx.templates.beanValidationAnnotationProperties(property, ctx)], ', ')
		lines.push(`@${jx}.validation.constraints.NotNull${props !== SKIP ? `(${props})` : ''}`)
	}

	lines.push(beanValidationCore(schema, ctx))

	return join(lines, '\n')
}
