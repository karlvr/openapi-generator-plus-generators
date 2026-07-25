import { JavaJaxrsTemplates, JavaModelContext, InjectParams, javax } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { pom } from './pom'
import { apiTest } from './apiTest'

/**
 * Declares a CDI-injected dependency field, annotated with `@Inject`. Callers embed this
 * behind their own single-tab indent (see `java-jaxrs-generator-common`'s single-line
 * default), so the field's own line bakes in that same indent after the annotation's
 * newline.
 */
function inject(params: InjectParams, ctx: JavaModelContext): string {
	const access = params.access ?? 'private'
	return `@${javax(ctx.root.useJakarta)}.inject.Inject\n\t${access} ${params.interface} ${params.name};`
}

/** The `@Dependent` annotation shared by the API implementation, API service implementation and invoker classes. */
function dependentAnnotation(ctx: JavaModelContext): string {
	return `@${javax(ctx.root.useJakarta)}.enterprise.context.Dependent`
}

/**
 * This generator's overrides of the DI, class-annotation and whole-file hooks from
 * `java-jaxrs-generator-common` and `java-jaxrs-server-generator`, wiring the generated
 * classes into CDI.
 */
export const hooks: Partial<JavaJaxrsTemplates> = {
	inject,
	apiImplClassAnnotations: (_group, ctx) => dependentAnnotation(ctx),
	apiServiceImplClassAnnotations: (_group, ctx) => dependentAnnotation(ctx),
	invokerClassAnnotations: (ctx) => dependentAnnotation(ctx),
	pom,
	apiTest,
}
