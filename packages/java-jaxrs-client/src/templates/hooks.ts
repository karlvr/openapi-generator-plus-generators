import { CodegenOperationGroup } from '@openapi-generator-plus/types'
import { className } from '@openapi-generator-plus/template-utils'
import { clientPojoPropertyAnnotations, JavaJaxrsTemplates, JavaModelContext } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { ClientRootContext } from './types'
import { pom } from './pom'

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
	pojoPropertyAnnotations: clientPojoPropertyAnnotations,
	injectApi,
	pom,
}
