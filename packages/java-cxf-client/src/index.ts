import { CodegenGeneratorConstructor } from '@openapi-generator-plus/types'
import path from 'path'
import { loadTemplates } from '@openapi-generator-plus/handlebars-templates'
import javaGenerator from '@openapi-generator-plus/java-jaxrs-client-generator'
import { CodegenOptionsCxfCdiClient } from './types'

export const createGenerator: CodegenGeneratorConstructor<CodegenOptionsCxfCdiClient> = (context) => ({
	...javaGenerator<CodegenOptionsCxfCdiClient>({
		...context,
		loadAdditionalTemplates: async(hbs) => {
			await loadTemplates(path.resolve(__dirname, '../templates'), hbs)
		},
		additionalWatchPaths: () => {
			return [path.resolve(__dirname, '../templates')]
		},
		customiseRootContext: async(rootContext) => {
			rootContext.generatorClass = '@openapi-generator-plus/java-cxf-client-generator'
		},
	}),
})

export default createGenerator
