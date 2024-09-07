import { CodegenConfig, CodegenGeneratorConstructor, CodegenGeneratorType } from '@openapi-generator-plus/types'
import path from 'path'
import { apiBasePath, configString, nullableConfigString } from '@openapi-generator-plus/generator-common'
import { emit, loadTemplates } from '@openapi-generator-plus/handlebars-templates'
import javaGenerator, { options as javaGeneratorOptions, packageToPath, JavaGeneratorContext } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { CodegenOptionsJavaServer } from './types'
export { packageToPath } from '@openapi-generator-plus/java-jaxrs-generator-common'
export { CodegenOptionsJavaServer } from './types'

export function options(config: CodegenConfig, context: JavaGeneratorContext): CodegenOptionsJavaServer {
	const options = javaGeneratorOptions(config, context)

	const packageName = configString(config, 'package', 'com.example')
	const apiServicePackage = configString(config, 'apiServicePackage', `${options.apiPackage}.service`)
	const result: CodegenOptionsJavaServer = {
		...options,
		apiServicePackage,
		apiServiceImplPackage: nullableConfigString(config, 'apiServiceImplPackage', `${apiServicePackage}.impl`),
		apiProviderPackage: configString(config, 'apiProviderPackage', `${packageName}.providers`),
		invokerPackage: nullableConfigString(config, 'invokerPackage', `${packageName}.app`),
		invokerName: nullableConfigString(config, 'invokerName', 'RestApplication'),
		authenticationRequiredAnnotation: nullableConfigString(config, 'authenticationRequiredAnnotation', nullableConfigString(config, 'authenticatedOperationAnnotation', null)),
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
		const relativeApiSourceOutputPath = generatorOptions.relativeApiSourceOutputPath
		const relativeApiImplSourceOutputPath = generatorOptions.relativeApiImplSourceOutputPath
	
		const apiPackagePath = packageToPath(generatorOptions.apiPackage)
		for (const group of doc.groups) {
			const operations = group.operations
			if (!operations.length) {
				continue
			}
			await emit('api', path.join(outputPath, relativeApiSourceOutputPath, apiPackagePath, `${context.generator().toClassName(group.name)}Api.java`), 
				{ ...rootContext, ...group, operations }, true, hbs)
		}
		
		const apiImplPackagePath = packageToPath(generatorOptions.apiImplPackage)
		for (const group of doc.groups) {
			const operations = group.operations
			if (!operations.length) {
				continue
			}
			await emit('apiImpl', path.join(outputPath, relativeApiImplSourceOutputPath, apiImplPackagePath, `${context.generator().toClassName(group.name)}ApiImpl.java`), 
				{ ...rootContext, ...group, operations }, true, hbs)
		}

		const apiServicePackagePath = packageToPath(generatorOptions.apiServicePackage)
		for (const group of doc.groups) {
			const operations = group.operations
			if (!operations.length) {
				continue
			}
			await emit('apiService', path.join(outputPath, relativeApiImplSourceOutputPath, apiServicePackagePath, `${context.generator().toClassName(group.name)}ApiService.java`), 
				{ ...rootContext, ...group, operations }, true, hbs)
		}

		if (generatorOptions.apiServiceImplPackage) {
			const apiServiceImplPackagePath = packageToPath(generatorOptions.apiServiceImplPackage)
			for (const group of doc.groups) {
				const operations = group.operations
				if (!operations.length) {
					continue
				}
				await emit('apiServiceImpl', path.join(outputPath, relativeApiImplSourceOutputPath, apiServiceImplPackagePath, `${context.generator().toClassName(group.name)}ApiServiceImpl.java`),
					{ ...rootContext, ...group }, false, hbs)
			}
		}

		if (generatorOptions.apiParamsPackage) {
			const apiParamsPackagePath = packageToPath(generatorOptions.apiParamsPackage)
			for (const group of doc.groups) {
				for (const operation of group.operations) {
					if (operation.useParamsClasses) {
						await emit('apiParams', path.join(outputPath, relativeApiSourceOutputPath, apiParamsPackagePath, `${context.generator().toClassName(operation.uniqueName)}Params.java`), 
							{ ...rootContext, group, ...operation }, true, hbs)
					}
				}
			}
		}

		const invokerPackagePath = generatorOptions.invokerPackage ? packageToPath(generatorOptions.invokerPackage) : undefined
		if (invokerPackagePath && generatorOptions.invokerName) {
			const basePath = apiBasePath(doc.servers)
			await emit('invoker', path.join(outputPath, relativeApiImplSourceOutputPath, invokerPackagePath, `Abstract${generatorOptions.invokerName}.java`), 
				{ ...rootContext, ...doc.info, basePath, groups: doc.groups }, true, hbs)
			await emit('invokerImpl', path.join(outputPath, relativeApiImplSourceOutputPath, invokerPackagePath, `${generatorOptions.invokerName}.java`), 
				{ ...rootContext, ...doc.info, basePath, groups: doc.groups }, false, hbs)
		}

		const providerPackagePath = generatorOptions.apiProviderPackage ? packageToPath(generatorOptions.apiProviderPackage) : undefined
		if (providerPackagePath) {
			await emit('AbstractApiJaxbJsonProvider', path.join(outputPath, relativeApiImplSourceOutputPath, providerPackagePath, 'AbstractApiJaxbJsonProvider.java'),
				{ ...rootContext }, true, hbs)
			await emit('ApiJaxbJsonProvider', path.join(outputPath, relativeApiImplSourceOutputPath, providerPackagePath, 'ApiJaxbJsonProvider.java'),
				{ ...rootContext }, false, hbs)
		}

		if (context.additionalExportTemplates) {
			context.additionalExportTemplates(outputPath, doc, hbs, rootContext)
		}
	}
	
	myContext.additionalCleanPathPatterns = () => {
		const relativeSourceOutputPath = generatorOptions.relativeSourceOutputPath
		const relativeApiSourceOutputPath = generatorOptions.relativeApiSourceOutputPath
		const relativeApiImplSourceOutputPath = generatorOptions.relativeApiImplSourceOutputPath
		
		const apiPackagePath = packageToPath(generatorOptions.apiPackage)
		const apiImplPackagePath = packageToPath(generatorOptions.apiImplPackage)
		const apiServicePackagePath = packageToPath(generatorOptions.apiServicePackage)

		const result = [
			path.join(relativeApiSourceOutputPath, apiPackagePath, '*Api.java'),
			path.join(relativeApiImplSourceOutputPath, apiImplPackagePath, '*ApiImpl.java'),
			path.join(relativeApiImplSourceOutputPath, apiServicePackagePath, '*ApiService.java'),
		]
		if (generatorOptions.apiParamsPackage) {
			const apiParamsPackagePath = packageToPath(generatorOptions.apiParamsPackage)
			result.push(path.join(relativeApiSourceOutputPath, apiParamsPackagePath, '*Params.java'))
		}
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
