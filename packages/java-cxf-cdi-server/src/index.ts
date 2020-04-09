import { CodegenGeneratorConstructor } from '@openapi-generator-plus/types'
import path from 'path'
import { loadTemplates } from '@openapi-generator-plus/handlebars-templates'
import javaGenerator, { CodegenOptionsJava } from '@openapi-generator-plus/java-jaxrs-server-generator'

export const createGenerator: CodegenGeneratorConstructor<CodegenOptionsJava> = (context) => ({
	...javaGenerator({
		...context,
		loadAdditionalTemplates: async(hbs) => {
			await loadTemplates(path.resolve(__dirname, '../templates'), hbs)
		},
		additionalWatchPaths: () => {
			return [path.resolve(__dirname, '../templates')]
		},
		customiseRootContext: async(rootContext) => {
			rootContext.generatorClass = '@openapi-generator-plus/java-cxf-cdi-server-generator'
		},
	}),
})

export default createGenerator
