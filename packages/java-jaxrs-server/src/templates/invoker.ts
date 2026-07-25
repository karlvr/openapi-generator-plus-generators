import { CodegenOperationGroup } from '@openapi-generator-plus/types'
import { ts, each, className, identifier } from '@openapi-generator-plus/template-utils'
import { InjectParams, generatedAnnotation, javax } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { ServerContext } from './types'

/** One group's injected API-implementation field, followed by a blank line. */
function injectedApi(group: CodegenOperationGroup, ctx: ServerContext): string {
	const generator = ctx.generatorContext.generator()
	const name = className(generator, group.name)
	const params: InjectParams = {
		access: 'protected',
		interface: `${ctx.root.apiPackage}.${name}Api`,
		class: `${ctx.root.apiPackage}.${name}ApiImpl`,
		name: `${identifier(generator, group.name)}Api`,
	}
	return `\t${ctx.templates.inject(params, ctx)}\n\n`
}

/**
 * The abstract base of the generated JAX-RS `Application`, initialising the API's
 * providers and one JAX-RS endpoint per operation group.
 */
export function invoker(groups: CodegenOperationGroup[], ctx: ServerContext): string {
	const jx = javax(ctx.root.useJakarta)
	const invokerName = ctx.root.invokerName
	const invokerPackage = ctx.root.invokerPackage
	const apiProviderPackage = ctx.root.apiProviderPackage
	if (!invokerName) {
		throw new Error('invoker requires invokerName to be set')
	}
	if (!invokerPackage) {
		throw new Error('invoker requires invokerPackage to be set')
	}
	if (!apiProviderPackage) {
		throw new Error('invoker requires apiProviderPackage to be set')
	}

	/* `each` group, joined with no separator (each already ends in its own blank
	   line). Trimmed to exactly one trailing newline before `protected void setup()`
	   that follows on the next template line, which supplies the separator itself. */
	const injectedApis = each(groups, group => injectedApi(group, ctx), '')
	const injectedApisText = typeof injectedApis === 'string' ? injectedApis.replace(/\n+$/, '\n') : injectedApis

	return ts`
package ${invokerPackage};

/**
 * This is the JAX-RS application that initializes the API, including adding providers and API endpoints.
 * <p>
 * We use explicit initialization of the JAX-RS application, rather than any automatic discovery of API endpoints
 * and providers, to avoid unexpectedly discovering other JAX-RS classes that might be present and to enable
 * multiple JAX-RS applications to coexist.
 * <p>
 * NOTE: This class is generated. Make any customisations in the class that extends this class.
 */
${generatedAnnotation(ctx.root)}
public abstract class Abstract${invokerName} extends ${jx}.ws.rs.core.Application {

	protected java.util.Set<Class<?>> classes;
	protected java.util.Set<Object> singletons;

${injectedApisText}
	protected void setup() {
		classes = new java.util.HashSet<>();
		singletons = new java.util.HashSet<>();

		addProviders();
		addEndpoints();
	}

	protected void addProviders() {
		classes.add(${apiProviderPackage}.ApiJaxbJsonProvider.class);
		classes.add(${apiProviderPackage}.NoExplodeCollectionParamConverterProvider.class);
	}

	protected void addEndpoints() {
${each(groups, group => `\t\tsingletons.add(${identifier(ctx.generatorContext.generator(), group.name)}Api);`, '\n')}
	}

	@java.lang.Override
	public java.util.Set<Class<?>> getClasses() {
		if (classes == null) {
			setup();
		}
		return classes;
	}

	@java.lang.Override
	public java.util.Set<Object> getSingletons() {
		if (singletons == null) {
			setup();
		}
		return singletons;
	}

}
`
}
