import { CodegenSchema, CodegenSchemaType, isCodegenArraySchema, isCodegenNumericSchema, isCodegenStringSchema } from '@openapi-generator-plus/types'
import { join, stringLiteral, SKIP, Skip } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from './types'
import { javax } from './helpers'
import { beanValidationAnnotationProperties } from './frag/beanValidationAnnotationProperties'

/** The value of vendor extension `key` on `schema`, as a string, or null if the key isn't present. */
function vex(schema: CodegenSchema, key: string): string | null {
	const value = schema.vendorExtensions?.[key]
	return value !== undefined ? String(value) : null
}

/** Whether vendor extension `key` is present on `schema` (regardless of its value). */
function hasVex(schema: CodegenSchema, key: string): boolean {
	return schema.vendorExtensions?.[key] !== undefined
}

/** A `message = "..."` annotation property, if `key` is present as a vendor extension on `schema`. */
function vexMessage(schema: CodegenSchema, key: string, ctx: JavaModelContext): string | Skip {
	const value = vex(schema, key)
	return value !== null ? `message = ${stringLiteral(ctx.generatorContext, value)}` : SKIP
}

/** Join annotation `parts` with the schema's shared {@link beanValidationAnnotationProperties}, comma-separated. */
function annotationProperties(parts: (string | Skip)[], schema: CodegenSchema, ctx: JavaModelContext): string | Skip {
	return join([...parts, beanValidationAnnotationProperties(schema, ctx)], ', ')
}

/**
 * The bean-validation constraint annotations implied by a schema's own
 * validation keywords: pattern, length/size bounds, numeric bounds, email,
 * not-blank and not-empty. These apply regardless of whether the schema is
 * used as a property or a parameter.
 */
export function beanValidationCore(schema: CodegenSchema, ctx: JavaModelContext): string | Skip {
	const jx = javax(ctx.root.useJakarta)
	const lines: (string | Skip)[] = []

	if (isCodegenStringSchema(schema)) {
		if (schema.pattern) {
			const props = annotationProperties([
				`regexp = ${stringLiteral(ctx.generatorContext, schema.pattern)}`,
				vexMessage(schema, 'x-pattern-message', ctx),
			], schema, ctx)
			lines.push(`@${jx}.validation.constraints.Pattern(${props})`)
		}
		if (schema.minLength || schema.maxLength) {
			const props = annotationProperties([
				schema.minLength ? `min = ${schema.minLength}` : SKIP,
				schema.maxLength ? `max = ${schema.maxLength}` : SKIP,
				vexMessage(schema, 'x-length-message', ctx),
			], schema, ctx)
			lines.push(`@${jx}.validation.constraints.Size(${props})`)
		}
	}

	if (isCodegenArraySchema(schema) && (schema.minItems || schema.maxItems)) {
		const props = annotationProperties([
			schema.minItems ? `min = ${schema.minItems}` : SKIP,
			schema.maxItems ? `max = ${schema.maxItems}` : SKIP,
			vexMessage(schema, 'x-length-message', ctx),
		], schema, ctx)
		lines.push(`@${jx}.validation.constraints.Size(${props})`)
	}

	if (isCodegenNumericSchema(schema)) {
		if (schema.schemaType === CodegenSchemaType.INTEGER) {
			if (schema.minimum !== null) {
				const props = annotationProperties([`value = ${schema.minimum}L`, vexMessage(schema, 'x-minimum-message', ctx)], schema, ctx)
				lines.push(`@${jx}.validation.constraints.Min(${props})`)
			}
			if (schema.maximum !== null) {
				const props = annotationProperties([`value = ${schema.maximum}L`, vexMessage(schema, 'x-maximum-message', ctx)], schema, ctx)
				lines.push(`@${jx}.validation.constraints.Max(${props})`)
			}
		} else {
			if (schema.minimum !== null) {
				const props = annotationProperties([`value = ${stringLiteral(ctx.generatorContext, schema.minimum)}`, vexMessage(schema, 'x-minimum-message', ctx)], schema, ctx)
				lines.push(`@${jx}.validation.constraints.DecimalMin(${props})`)
			}
			if (schema.maximum !== null) {
				const props = annotationProperties([`value = ${stringLiteral(ctx.generatorContext, schema.maximum)}`, vexMessage(schema, 'x-maximum-message', ctx)], schema, ctx)
				lines.push(`@${jx}.validation.constraints.DecimalMax(${props})`)
			}
		}
	}

	/* Email addresses */
	const emailProps = annotationProperties([vexMessage(schema, 'x-email-message', ctx)], schema, ctx)
	if (schema.format === 'email' || hasVex(schema, 'x-email')) {
		lines.push(`@${jx}.validation.constraints.Email${emailProps !== SKIP ? `(${emailProps})` : ''}`)
	}

	/* Not blank */
	if (hasVex(schema, 'x-not-blank')) {
		const props = annotationProperties([vexMessage(schema, 'x-not-blank-message', ctx)], schema, ctx)
		lines.push(`@${jx}.validation.constraints.NotBlank${props !== SKIP ? `(${props})` : ''}`)
	}

	/* Not empty */
	if (schema.vendorExtensions?.['x-not-empty']) {
		const props = annotationProperties([vexMessage(schema, 'x-not-empty-message', ctx)], schema, ctx)
		lines.push(`@${jx}.validation.constraints.NotEmpty${props !== SKIP ? `(${props})` : ''}`)
	}

	return join(lines, '\n')
}
