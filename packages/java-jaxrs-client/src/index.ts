import { CodegenGeneratorType, CodegenGenerator } from '@openapi-generator-plus/types'
import path from 'path'
import { loadTemplates } from '@openapi-generator-plus/handlebars-templates'
import javaGenerator, { JavaGeneratorContext } from '@openapi-generator-plus/java-jaxrs-generator-common'
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
			}
			
			if (context.transformOptions) {
				return context.transformOptions(config, options)
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
	})

	return {
		...base,
		generatorType: () => CodegenGeneratorType.CLIENT,
	}
}
