import { CodegenOperationGroup, CodegenProperty } from '@openapi-generator-plus/types'
import { className, stringLiteral } from '@openapi-generator-plus/template-utils'
import { JavaJaxrsTemplates, JavaModelContext } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { ClientRootContext } from './types'
import { pom } from './pom'

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

/**
 * Declares the field holding the low-level `ApiSpec` client, delegating to the generic
 * `inject` hook — with no injection framework in play, this is a concrete field
 * instantiated inline (see `inject`'s own default). A descendant generator that overrides
 * `inject` (e.g. to wire up CDI/Spring) gets that behaviour here for free; one that manages
 * the API client itself (e.g. constructing it from a CXF `JAXRSClientFactory` call) instead
 * overrides `injectApi` directly to bypass `inject` entirely.
 */
function injectApi(group: CodegenOperationGroup, name: string, ctx: JavaModelContext): string {
	const root = ctx.root as ClientRootContext
	const interfaceType = `${root.apiSpecPackage}.${className(ctx.generatorContext.generator(), group.name)}ApiSpec`
	return ctx.templates.inject({ interface: interfaceType, name }, ctx)
}

/**
 * This generator's overrides of the model-emission hooks from `java-jaxrs-generator-common`,
 * plus its own `pom.xml` template and the JAX-RS client branch's `injectApi` default.
 *
 * The extension points a CXF-based client overrides on top of this generator —
 * `apiConstantsBody`, `apiImplHeader`, `apiImplClassBody`, `apiInvokerInterfaceBody`,
 * `pomBuild`, `pomDependencies` and `pomDependencyManagement` — render nothing by default
 * (see `java-jaxrs-generator-common`'s defaults), matching this generator's own (blank)
 * hook content; this generator doesn't need to override them itself.
 */
export const hooks: Partial<JavaJaxrsTemplates> = {
	pojoPropertyAnnotations,
	injectApi,
	pom,
}
