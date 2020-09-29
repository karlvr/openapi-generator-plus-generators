import { CodegenGeneratorType, CodegenGenerator } from '@openapi-generator-plus/types'
import path from 'path'
import { emit, loadTemplates } from '@openapi-generator-plus/handlebars-templates'
import javaGenerator, { packageToPath, JavaGeneratorContext } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { CodegenOptionsJavaClient } from './types'
export { CodegenOptionsJavaClient } from './types'
export { packageToPath } from '@openapi-generator-plus/java-jaxrs-generator-common'

export default function createGenerator<O extends CodegenOptionsJavaClient>(context: JavaGeneratorContext<O>): CodegenGenerator<O> {

	const base = javaGenerator<O>({
		...context,
		loadAdditionalTemplates: async(hbs) => {
			await loadTemplates(path.resolve(__dirname, '../templates'), hbs)

			if (context.loadAdditionalTemplates) {
				await context.loadAdditionalTemplates(hbs)
			}
		},
		additionalWatchPaths: (config) => {
			const result = [path.resolve(__dirname, '../templates')]
			
			if (context.additionalWatchPaths) {
				result.push(...context.additionalWatchPaths(config))
			}

			return result
		},
		transformOptions: (config, options) => {
			const result: CodegenOptionsJavaClient = {
				...options,
				apiSpecPackage: config.apiSpecPackage || `${options.apiPackage}.spec`,
			}

			if (context.transformOptions) {
				return context.transformOptions(config, result)
			} else {
				return result as O
			}
		},
		customiseRootContext: async(rootContext) => {
			rootContext.generatorClass = '@openapi-generator-plus/java-jaxrs-client-generator'
			if (context.customiseRootContext) {
				context.customiseRootContext(rootContext)
			}
		},
		additionalExportTemplates: async(outputPath, doc, hbs, rootContext, state) => {
			const relativeSourceOutputPath = state.options.relativeSourceOutputPath

			const apiPackagePath = packageToPath(state.options.apiPackage)
			await emit('ApiConstants', path.join(outputPath, relativeSourceOutputPath, apiPackagePath, 'ApiConstants.java'), {
				server: doc.servers && doc.servers.length ? doc.servers[0] : undefined, ...state.options, ...rootContext,
			}, false, hbs)
			await emit('ApiInvoker', path.join(outputPath, relativeSourceOutputPath, apiPackagePath, 'ApiInvoker.java'), 
				{ ...state.options, ...rootContext }, true, hbs)

			const apiSpecPackagePath = packageToPath(state.options.apiSpecPackage)
			for (const group of doc.groups) {
				const operations = group.operations
				if (!operations.length) {
					continue
				}
				await emit('apiSpec', path.join(outputPath, relativeSourceOutputPath, apiSpecPackagePath, `${state.generator.toClassName(group.name, state)}ApiSpec.java`), 
					{ ...group, operations, ...state.options, ...rootContext }, true, hbs)
			}

			if (context.additionalExportTemplates) {
				context.additionalExportTemplates(outputPath, doc, hbs, rootContext, state)
			}
		},
	})

	return {
		...base,
		generatorType: () => CodegenGeneratorType.CLIENT,
	}
}
