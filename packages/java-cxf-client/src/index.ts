import { CodegenGeneratorConstructor } from '@openapi-generator-plus/types'
import path from 'path'
import { emit, loadTemplates } from '@openapi-generator-plus/handlebars-templates'
import javaGenerator from '@openapi-generator-plus/java-jaxrs-client-generator'
import { CodegenOptionsCxfCdiClient } from './types'
import { packageToPath, JavaGeneratorContext } from '@openapi-generator-plus/java-jaxrs-generator-common'

export const createGenerator: CodegenGeneratorConstructor<CodegenOptionsCxfCdiClient> = (context: JavaGeneratorContext<CodegenOptionsCxfCdiClient>) => ({
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
		additionalExportTemplates: async(outputPath, doc, hbs, rootContext, state) => {
			const relativeSourceOutputPath = state.options.relativeSourceOutputPath
			const apiPackagePath = packageToPath(state.options.apiPackage)

			await emit('ApiProviders', path.join(outputPath, relativeSourceOutputPath, apiPackagePath, 'ApiProviders.java'), {
				servers: doc.servers, server: doc.servers && doc.servers.length ? doc.servers[0] : undefined, ...state.options, ...rootContext,
			}, false, hbs)

			if (context.additionalExportTemplates) {
				context.additionalExportTemplates(outputPath, doc, hbs, rootContext, state)
			}
		},
	}),
})

export default createGenerator
