import { CodegenOperationGroup } from '@openapi-generator-plus/types'
import { className } from '@openapi-generator-plus/template-utils'
import { JavaJaxrsTemplates, JavaModelContext, InjectParams } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { pom } from './pom'
import { apiTest } from './apiTest'

/**
 * Declares a Spring-injected dependency field, annotated with `@Autowired`. Callers embed
 * this behind their own single-tab indent (see `java-jaxrs-generator-common`'s single-line
 * default), so the field's own line bakes in that same indent after the annotation's newline.
 */
function inject(params: InjectParams): string {
	const access = params.access ?? 'private'
	return `@org.springframework.beans.factory.annotation.Autowired\n\t${access} ${params.interface} ${params.name};`
}

/** The API implementation class is named as a Spring bean, so a group's `Api` and `ApiService` implementations can coexist. */
function apiImplClassAnnotations(group: CodegenOperationGroup, ctx: JavaModelContext): string {
	const name = className(ctx.generatorContext.generator(), group.name)
	return `@org.springframework.stereotype.Service("${name}Api")`
}

/**
 * This generator's overrides of the DI, class-annotation and whole-file hooks from
 * `java-jaxrs-generator-common` and `java-jaxrs-server-generator`, wiring the generated
 * classes into Spring.
 */
export const hooks: Partial<JavaJaxrsTemplates> = {
	inject,
	apiImplClassAnnotations,
	apiServiceImplClassAnnotations: () => '@org.springframework.stereotype.Service',
	jaxbJsonProviderAnnotations: () => '@org.springframework.stereotype.Service("ApiJaxbJsonProvider")',
	pom,
	apiTest,
}
