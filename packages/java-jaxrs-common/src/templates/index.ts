import { SKIP, stringLiteral } from '@openapi-generator-plus/template-utils'
import { JavaJaxrsTemplates } from './types'

export { RootContext, JavaModelContext, JavaJaxrsTemplates } from './types'
export { pojo } from './pojo'
export { enumTemplate } from './enum'
export { interfaceTemplate } from './interface'
export { wrapper } from './wrapper'

/**
 * The default implementation of every model-path hook, matching the content
 * the original Handlebars extension partials rendered by default. A child
 * generator overrides individual entries via the chained
 * {@link JavaGeneratorContext.templates} bag (see `chainJavaGeneratorContext`
 * in the package's `index.ts`); this package merges its own defaults
 * underneath whatever the effective chain supplies.
 */
export const javaJaxrsCommonTemplates: Required<JavaJaxrsTemplates> = {
	pojoHeader: () => SKIP,
	pojoFooter: () => SKIP,
	pojoHeaderAnnotations: () => SKIP,
	pojoPropertyAnnotations: (property, ctx) => `@com.fasterxml.jackson.annotation.JsonProperty(${stringLiteral(ctx.generatorContext, property.serializedName)})`,
	pojoImplementsExtras: () => SKIP,
	enumHeader: () => SKIP,
	enumFooter: () => SKIP,
	enumHeaderAnnotations: () => SKIP,
	wrapperHeaderAnnotations: () => SKIP,
	beanValidationAnnotationProperties: () => SKIP,
}
