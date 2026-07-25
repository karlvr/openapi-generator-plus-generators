import { CodegenProperty } from '@openapi-generator-plus/types'
import { join, SKIP, Skip } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from '../types'
import { propertyStatusAnnotations } from './propertyStatusAnnotations'
import { propertyAnnotations } from './propertyAnnotations'
import { beanValidation } from '../beanValidation'

/**
 * The full annotation block for a model property field: its status
 * (`@Deprecated`) annotation, its `@Schema` annotation, any `x-extra-annotation`
 * vendor extension, the `pojoPropertyAnnotations` hook (or, for a caller with
 * its own fixed annotation such as a wrapper's single property, an explicit
 * `overrideAnnotations` in its place), and bean-validation constraints.
 */
export function pojoPropertyAnnotations(property: CodegenProperty, ctx: JavaModelContext, overrideAnnotations?: string): string | Skip {
	const extraAnnotation = property.schema.vendorExtensions?.['x-extra-annotation']

	return join([
		propertyStatusAnnotations(property),
		propertyAnnotations(property, ctx),
		extraAnnotation !== undefined ? String(extraAnnotation) : SKIP,
		overrideAnnotations !== undefined ? overrideAnnotations : ctx.templates.pojoPropertyAnnotations(property, ctx),
		ctx.root.useBeanValidation ? beanValidation(property, ctx) : SKIP,
	], '\n')
}
