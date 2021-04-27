import { CodegenConfig, CodegenGeneratorConstructor, CodegenGeneratorType } from '@openapi-generator-plus/types'
import path from 'path'
import { apiBasePath } from '@openapi-generator-plus/generator-common'
import { emit, loadTemplates } from '@openapi-generator-plus/handlebars-templates'
import javaGenerator, { options as javaGeneratorOptions, packageToPath, JavaGeneratorContext } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { CodegenOptionsJavaServer } from './types'
export { packageToPath } from '@openapi-generator-plus/java-jaxrs-generator-common'
export { CodegenOptionsJavaServer } from './types'

export function options(config: CodegenConfig, context: JavaGeneratorContext): CodegenOptionsJavaServer {
	const options = javaGeneratorOptions(config, context)

	const packageName = config.package || 'com.example'
	const apiServicePackage = config.apiServicePackage || `${options.apiPackage}.service`
	const result: CodegenOptionsJavaServer = {
		...options,
		apiServicePackage,
		apiServiceImplPackage: config.apiServiceImplPackage || `${apiServicePackage}.impl`,
		apiProviderPackage: config.apiProviderPackage || `${packageName}.providers`,
		invokerPackage: config.invokerPackage !== undefined ? config.invokerPackage : `${packageName}.app`,
		authenticationRequiredAnnotation: config.authenticationRequiredAnnotation || config.authenticatedOperationAnnotation || null,
	}
	
	return result
}

export const createGenerator: CodegenGeneratorConstructor<JavaGeneratorContext> = (config, context) => {
	const myContext: JavaGeneratorContext = {
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

	const generatorOptions = options(config, myContext)

	myContext.additionalExportTemplates = async(outputPath, doc, hbs, rootContext) => {
		const relativeSourceOutputPath = generatorOptions.relativeSourceOutputPath
	
		const apiPackagePath = packageToPath(generatorOptions.apiPackage)
		for (const group of doc.groups) {
			const operations = group.operations
			if (!operations.length) {
				continue
			}
			await emit('api', path.join(outputPath, relativeSourceOutputPath, apiPackagePath, `${context.generator().toClassName(group.name)}Api.java`), 
				{ ...rootContext, ...group, operations }, true, hbs)
		}
		
		const apiImplPackagePath = packageToPath(generatorOptions.apiImplPackage)
		for (const group of doc.groups) {
			const operations = group.operations
			if (!operations.length) {
				continue
			}
			await emit('apiImpl', path.join(outputPath, relativeSourceOutputPath, apiImplPackagePath, `${context.generator().toClassName(group.name)}ApiImpl.java`), 
				{ ...rootContext, ...group, operations }, true, hbs)
		}

		const apiServicePackagePath = packageToPath(generatorOptions.apiServicePackage)
		for (const group of doc.groups) {
			const operations = group.operations
			if (!operations.length) {
				continue
			}
			await emit('apiService', path.join(outputPath, relativeSourceOutputPath, apiServicePackagePath, `${context.generator().toClassName(group.name)}ApiService.java`), 
				{ ...rootContext, ...group, operations }, true, hbs)
		}

		const apiServiceImplPackagePath = packageToPath(generatorOptions.apiServiceImplPackage)
		for (const group of doc.groups) {
			const operations = group.operations
			if (!operations.length) {
				continue
			}
			await emit('apiServiceImpl', path.join(outputPath, relativeSourceOutputPath, apiServiceImplPackagePath, `${context.generator().toClassName(group.name)}ApiServiceImpl.java`),
				{ ...rootContext, ...group }, false, hbs)
		}

		const invokerPackagePath = generatorOptions.invokerPackage ? packageToPath(generatorOptions.invokerPackage) : undefined
		if (invokerPackagePath) {
			const basePath = apiBasePath(doc.servers)
			await emit('invoker', path.join(outputPath, relativeSourceOutputPath, invokerPackagePath, 'RestApplication.java'), 
				{ ...rootContext, ...doc.info, basePath }, false, hbs)
		}

		const providerPackagePath = generatorOptions.apiProviderPackage ? packageToPath(generatorOptions.apiProviderPackage) : undefined
		if (providerPackagePath) {
			await emit('MyJaxbJsonProvider', path.join(outputPath, relativeSourceOutputPath, providerPackagePath, 'MyJaxbJsonProvider.java'),
				{ ...rootContext }, true, hbs)
		}

		if (context.additionalExportTemplates) {
			context.additionalExportTemplates(outputPath, doc, hbs, rootContext)
		}
	}
	
	myContext.additionalCleanPathPatterns = () => {
		const relativeSourceOutputPath = generatorOptions.relativeSourceOutputPath
		
		const apiServicePackagePath = packageToPath(generatorOptions.apiServicePackage)

		const result = [
			path.join(relativeSourceOutputPath, apiServicePackagePath, '*ApiService.java'),
		]
		if (context.additionalCleanPathPatterns) {
			result.push(...context.additionalCleanPathPatterns())
		}
		return result
	}

	const base = javaGenerator(config, myContext)
	return {
		...base,
		templateRootContext: () => {
			return {
				...base.templateRootContext(),
				...generatorOptions,
				generatorClass: '@openapi-generator-plus/java-jaxrs-server-generator',
			}
		},
		generatorType: () => CodegenGeneratorType.SERVER,
	}
}

export default createGenerator
