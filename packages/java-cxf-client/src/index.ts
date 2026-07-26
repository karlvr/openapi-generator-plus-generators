import { CodegenGeneratorConstructor } from '@openapi-generator-plus/types'
import javaGenerator, { options as javaGeneratorOptions } from '@openapi-generator-plus/java-jaxrs-client-generator'
import { JavaGeneratorContext, chainJavaGeneratorContext } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { hooks } from './templates/hooks'

export const createGenerator: CodegenGeneratorConstructor<JavaGeneratorContext> = (config, context) => {
	const myContext: JavaGeneratorContext = chainJavaGeneratorContext(context, {
		templates: hooks,
	})

	const generatorOptions = javaGeneratorOptions(config, myContext)

	const base = javaGenerator(config, myContext)
	return {
		...base,
		templateRootContext: () => {
			return {
				...base.templateRootContext(),
				...generatorOptions,
				generatorClass: '@openapi-generator-plus/java-cxf-client-generator',
			}
		},
	}
}

export default createGenerator
