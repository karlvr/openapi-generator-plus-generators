import { CodegenGeneratorConstructor, CodegenGeneratorType } from '@openapi-generator-plus/types'
import path from 'path'
import { apiBasePath } from '@openapi-generator-plus/generator-common'
import { emit, loadTemplates } from '@openapi-generator-plus/handlebars-templates'
import javaGenerator, { packageToPath, JavaGeneratorContext } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { CodegenOptionsJavaServer } from './types'
export { packageToPath } from '@openapi-generator-plus/java-jaxrs-generator-common'
export { CodegenOptionsJavaServer } from './types'

export const createGenerator: CodegenGeneratorConstructor<CodegenOptionsJavaServer, JavaGeneratorContext<CodegenOptionsJavaServer>> = (context) => {
	const base = javaGenerator<CodegenOptionsJavaServer>({
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
		additionalExportTemplates: async(outputPath, doc, hbs, rootContext, state) => {
			const relativeSourceOutputPath = state.options.relativeSourceOutputPath
			const apiPackagePath = packageToPath(state.options.apiPackage)
	
			for (const group of doc.groups) {
				const operations = group.operations
				if (!operations.length) {
					continue
				}
				await emit('apiService', path.join(outputPath, relativeSourceOutputPath, apiPackagePath, `${state.generator.toClassName(group.name, state)}ApiService.java`), 
					{ ...group, operations, ...state.options, ...rootContext }, true, hbs)
			}

			const apiImplPackagePath = packageToPath(state.options.apiServiceImplPackage)
			for (const group of doc.groups) {
				const operations = group.operations
				if (!operations.length) {
					continue
				}
				await emit('apiServiceImpl', path.join(outputPath, relativeSourceOutputPath, apiImplPackagePath, `${state.generator.toClassName(group.name, state)}ApiServiceImpl.java`),
					{ ...group, ...state.options, ...rootContext }, false, hbs)
			}

			const invokerPackagePath = state.options.invokerPackage ? packageToPath(state.options.invokerPackage) : undefined
			if (invokerPackagePath) {
				const basePath = apiBasePath(doc.servers)
				await emit('invoker', path.join(outputPath, relativeSourceOutputPath, invokerPackagePath, 'RestApplication.java'), 
					{ ...doc.info, ...state.options, ...rootContext, basePath }, false, hbs)
			}

			if (context.additionalExportTemplates) {
				context.additionalExportTemplates(outputPath, doc, hbs, rootContext, state)
			}
		},
		transformOptions: (config, options) => {
			const packageName = config.package || 'com.example'
			const apiServicePackage = config.apiServicePackage || `${options.apiPackage}.service`
			const result: CodegenOptionsJavaServer = {
				...options,
				apiServicePackage,
				apiServiceImplPackage: config.apiServiceImplPackage || `${apiServicePackage}.impl`,
				invokerPackage: config.invokerPackage !== undefined ? config.invokerPackage : `${packageName}.app`,
				authenticatedOperationAnnotation: config.authenticatedOperationAnnotation,
			}
			
			if (context.transformOptions) {
				return context.transformOptions(config, options)
			} else {
				return result
			}
		},
		customiseRootContext: async(rootContext) => {
			rootContext.generatorClass = '@openapi-generator-plus/java-jaxrs-server-generator'
			if (context.customiseRootContext) {
				context.customiseRootContext(rootContext)
			}
		},
		additionalCleanPathPatterns: (options) => {
			const relativeSourceOutputPath = options.relativeSourceOutputPath
			
			const apiServicePackagePath = packageToPath(options.apiServicePackage)

			const result = [
				path.join(relativeSourceOutputPath, apiServicePackagePath, '*ApiService.java'),
			]
			if (context.additionalCleanPathPatterns) {
				result.push(...context.additionalCleanPathPatterns(options))
			}
			return result
		},
	})
	return {
		...base,
		generatorType: () => CodegenGeneratorType.SERVER,
	}
}

export default createGenerator
