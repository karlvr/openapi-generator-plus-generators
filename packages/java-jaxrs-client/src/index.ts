import { CodegenGeneratorType, CodegenGenerator, CodegenConfig } from '@openapi-generator-plus/types'
import path from 'path'
import { emit, loadTemplates } from '@openapi-generator-plus/handlebars-templates'
import javaGenerator, { options as javaGeneratorOptions, packageToPath, JavaGeneratorContext } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { CodegenOptionsJavaClient } from './types'
export { CodegenOptionsJavaClient } from './types'
export { packageToPath } from '@openapi-generator-plus/java-jaxrs-generator-common'

export function options(config: CodegenConfig, context: JavaGeneratorContext): CodegenOptionsJavaClient {
	const parentOptions = javaGeneratorOptions(config, context)
	const generatorOptions: CodegenOptionsJavaClient = {
		...parentOptions,
		apiSpecPackage: config.apiSpecPackage || `${parentOptions.apiPackage}.spec`,
	}
	return generatorOptions
}

export default function createGenerator(config: CodegenConfig, context: JavaGeneratorContext): CodegenGenerator {
	const javaGeneratorContext: JavaGeneratorContext = {
		...context,
		loadAdditionalTemplates: async(hbs) => {
			await loadTemplates(path.resolve(__dirname, '../templates'), hbs)

			if (context.loadAdditionalTemplates) {
				await context.loadAdditionalTemplates(hbs)
			}
		},
		additionalWatchPaths: () => {
			const result = [path.resolve(__dirname, '../templates')]
			
			if (context.additionalWatchPaths) {
				result.push(...context.additionalWatchPaths())
			}

			return result
		},
	}

	const generatorOptions = options(config, javaGeneratorContext)

	context.additionalExportTemplates = async(outputPath, doc, hbs, rootContext) => {
		const relativeSourceOutputPath = generatorOptions.relativeSourceOutputPath

		const apiPackagePath = packageToPath(generatorOptions.apiPackage)
		await emit('ApiConstants', path.join(outputPath, relativeSourceOutputPath, apiPackagePath, 'ApiConstants.java'), {
			...rootContext, servers: doc.servers, server: doc.servers && doc.servers.length ? doc.servers[0] : undefined,
		}, true, hbs)
		await emit('ApiInvoker', path.join(outputPath, relativeSourceOutputPath, apiPackagePath, 'ApiInvoker.java'), 
			{ ...rootContext }, true, hbs)

		const apiSpecPackagePath = packageToPath(generatorOptions.apiSpecPackage)
		for (const group of doc.groups) {
			const operations = group.operations
			if (!operations.length) {
				continue
			}
			await emit('apiSpec', path.join(outputPath, relativeSourceOutputPath, apiSpecPackagePath, `${context.generator().toClassName(group.name)}ApiSpec.java`), 
				{ ...rootContext, ...group, operations }, true, hbs)
		}

		if (context.additionalExportTemplates) {
			context.additionalExportTemplates(outputPath, doc, hbs, rootContext)
		}
	}

	const base = javaGenerator(config, javaGeneratorContext)
	return {
		...base,
		templateRootContext: () => {
			return {
				...base.templateRootContext(),
				...generatorOptions,
				generatorClass: '@openapi-generator-plus/java-jaxrs-client-generator',
			}
		},
		generatorType: () => CodegenGeneratorType.CLIENT,
	}
}
