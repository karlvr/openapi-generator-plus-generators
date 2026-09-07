import { CodegenGeneratorConstructor } from '@openapi-generator-plus/types'
import javaGenerator, { JaxrsClientContext } from '@openapi-generator-plus/java-jaxrs-client-generator'
import { JavaGeneratorContext, chainJavaGeneratorContext } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { hooks } from './templates/hooks'

export const createGenerator: CodegenGeneratorConstructor<JavaGeneratorContext> = (config, context) => {
	const myContext: JaxrsClientContext = chainJavaGeneratorContext(context, {
		templates: hooks,
	})

	/*
	 * This generator renders its own Retrofit interface through the `api` template, so the
	 * project needs no JAX-RS client, and its `pom.xml` declares no JAX-RS implementation.
	 */
	myContext.emitJaxrsClient = false

	/*
	 * A JAX-RS provider has nothing to register with in a Retrofit project, so none is
	 * generated. A caller who names the package gets them anyway.
	 */
	const base = javaGenerator({ apiProviderPackage: null, ...config }, myContext)
	return {
		...base,
		templateRootContext: () => {
			return {
				...base.templateRootContext(),
				generatorClass: '@openapi-generator-plus/java-retrofit-client-generator',
			}
		},
	}
}

export { RETROFIT_UNSUPPORTED_BODY_MESSAGE } from './templates/api'

export default createGenerator
