import { CodegenGeneratorConstructor } from '@openapi-generator-plus/types'
import path from 'path'
import { loadTemplates, emit } from '@openapi-generator-plus/handlebars-templates'
import javaGenerator, { CodegenOptionsJavaServer, packageToPath } from '@openapi-generator-plus/java-jaxrs-server-generator'

export const createGenerator: CodegenGeneratorConstructor<CodegenOptionsJavaServer> = (context) => ({
	...javaGenerator({
		...context,
		loadAdditionalTemplates: async(hbs) => {
			await loadTemplates(path.resolve(__dirname, '../templates'), hbs)
		},
		additionalWatchPaths: () => {
			return [path.resolve(__dirname, '../templates')]
		},
		customiseRootContext: async(rootContext) => {
			rootContext.generatorClass = '@openapi-generator-plus/java-cxf-spring-server-generator'
		},
		additionalExportTemplates: async(outputPath, doc, hbs, rootContext, state) => {
			if (state.options.includeTests) {
				const relativeTestOutputPath = state.options.relativeTestOutputPath
				const apiPackagePath = packageToPath(state.options.apiPackage)

				await emit('tests/TestConfiguration', path.join(outputPath, relativeTestOutputPath, apiPackagePath, 'TestConfiguration.java'), { ...state.options, ...rootContext }, false, hbs)
			}
		},
	}),
})

export default createGenerator
