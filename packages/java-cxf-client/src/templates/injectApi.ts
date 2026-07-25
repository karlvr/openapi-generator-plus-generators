import { CodegenOperationGroup } from '@openapi-generator-plus/types'
import { className } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { ClientRootContext } from '@openapi-generator-plus/java-jaxrs-client-generator'

/**
 * Declares the field holding the low-level `ApiSpec` client. Unlike `java-jaxrs-client`'s own
 * default (which delegates to the generic `inject` hook), this client constructs and manages
 * the `ApiSpec`/CXF client pair itself (see `apiImplClassBody`'s constructors), so the field
 * is declared bare rather than through `inject`.
 */
export function injectApi(group: CodegenOperationGroup, name: string, ctx: JavaModelContext): string {
	const root = ctx.root as ClientRootContext
	const generator = ctx.generatorContext.generator()
	return `private ${root.apiSpecPackage}.${className(generator, group.name)}ApiSpec ${name};`
}
