import { CodegenGeneratorConstructor } from '@openapi-generator-plus/types'
import path from 'path'
import { loadTemplates } from '@openapi-generator-plus/handlebars-templates'
import javaGenerator from '@openapi-generator-plus/java-jaxrs-client-generator'

export const createGenerator: CodegenGeneratorConstructor = (config, context) => ({
	...javaGenerator(config, {
		...context,
		loadAdditionalTemplates: async(hbs) => {
			await loadTemplates(path.resolve(__dirname, '../templates'), hbs)
		},
		additionalWatchPaths: () => {
			return [path.resolve(__dirname, '../templates')]
		},
		customiseRootContext: async(rootContext) => {
			rootContext.generatorClass = '@openapi-generator-plus/java-retrofit-client-generator'
		},
	}),
})

export default createGenerator
