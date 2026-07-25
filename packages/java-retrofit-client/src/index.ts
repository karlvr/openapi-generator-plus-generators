import { CodegenGeneratorConstructor } from '@openapi-generator-plus/types'
import javaGenerator from '@openapi-generator-plus/java-jaxrs-client-generator'
import { JavaGeneratorContext, chainJavaGeneratorContext } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { hooks } from './templates/hooks'

export const createGenerator: CodegenGeneratorConstructor<JavaGeneratorContext> = (config, context) => {
	const myContext: JavaGeneratorContext = chainJavaGeneratorContext(context, {
		templates: hooks,
	})

	const base = javaGenerator(config, myContext)
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

export default createGenerator
