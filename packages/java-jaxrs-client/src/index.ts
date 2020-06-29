import { CodegenGeneratorConstructor, CodegenGeneratorType } from '@openapi-generator-plus/types'
import path from 'path'
import { loadTemplates } from '@openapi-generator-plus/handlebars-templates'
import javaGenerator, { JavaGeneratorContext } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { CodegenOptionsJavaClient } from './types'
export { CodegenOptionsJavaClient } from './types'

export const createGenerator: CodegenGeneratorConstructor<CodegenOptionsJavaClient, JavaGeneratorContext<CodegenOptionsJavaClient>> = (context) => {
	const base = javaGenerator<CodegenOptionsJavaClient>({
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
			return result
		},
	})

	return {
		...base,
		generatorType: () => CodegenGeneratorType.CLIENT,
	}
}

export default createGenerator
