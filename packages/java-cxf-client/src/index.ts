import { CodegenGeneratorConstructor } from '@openapi-generator-plus/types'
import path from 'path'
import { loadTemplates } from '@openapi-generator-plus/handlebars-templates'
import javaGenerator, { options as javaGeneratorOptions } from '@openapi-generator-plus/java-jaxrs-client-generator'
import { JavaGeneratorContext } from '@openapi-generator-plus/java-jaxrs-generator-common'

export const createGenerator: CodegenGeneratorConstructor = (config, context: JavaGeneratorContext) => {
	const myContext: JavaGeneratorContext = {
		...context,
		loadAdditionalTemplates: async(hbs) => {
			await loadTemplates(path.resolve(__dirname, '../templates'), hbs)
		},
		additionalWatchPaths: () => {
			return [path.resolve(__dirname, '../templates')]
		},
	}

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
