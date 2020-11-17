import { CodegenGeneratorConstructor } from '@openapi-generator-plus/types'
import path from 'path'
import { loadTemplates } from '@openapi-generator-plus/handlebars-templates'
import javaGenerator from '@openapi-generator-plus/java-jaxrs-client-generator'

export const createGenerator: CodegenGeneratorConstructor = (config, context) => {
	const base = javaGenerator(config, {
		...context,
		loadAdditionalTemplates: async(hbs) => {
			await loadTemplates(path.resolve(__dirname, '../templates'), hbs)
		},
		additionalWatchPaths: () => {
			return [path.resolve(__dirname, '../templates')]
		},
	})

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
