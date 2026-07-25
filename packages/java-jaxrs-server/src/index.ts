import { CodegenConfig, CodegenGeneratorConstructor, CodegenGeneratorType } from '@openapi-generator-plus/types'
import path from 'path'
import { apiBasePath, configString, nullableConfigString } from '@openapi-generator-plus/generator-common'
import { emit as emitTemplate } from '@openapi-generator-plus/template-utils'
import javaGenerator, {
	options as javaGeneratorOptions, packageToPath, JavaGeneratorContext, chainJavaGeneratorContext,
	javaJaxrsCommonTemplates, EffectiveJavaJaxrsTemplates, apiParams,
} from '@openapi-generator-plus/java-jaxrs-generator-common'
import { CodegenOptionsJavaServer } from './types'
import { MyResponse } from './internal-types'
import { hooks } from './templates/hooks'
import { ServerContext, ServerRootContext } from './templates/types'
import { api } from './templates/api'
import { apiImpl } from './templates/apiImpl'
import { apiService } from './templates/apiService'
import { apiServiceImpl } from './templates/apiServiceImpl'
import { invoker } from './templates/invoker'
import { invokerImpl } from './templates/invokerImpl'
import { abstractApiJaxbJsonProvider } from './templates/AbstractApiJaxbJsonProvider'
import { apiJaxbJsonProvider } from './templates/ApiJaxbJsonProvider'
export { packageToPath } from '@openapi-generator-plus/java-jaxrs-generator-common'
export { CodegenOptionsJavaServer } from './types'
export { ServerContext, ServerRootContext } from './templates/types'
export { bodyParam } from './templates/frag/bodyParam'

export function options(config: CodegenConfig, context: JavaGeneratorContext): CodegenOptionsJavaServer {
	const options = javaGeneratorOptions(config, context)

	const packageName = configString(config, 'package', 'com.example')
	const apiServicePackage = configString(config, 'apiServicePackage', `${options.apiPackage}.service`)
	const result: CodegenOptionsJavaServer = {
		...options,
		apiServicePackage,
		apiServiceImplPackage: nullableConfigString(config, 'apiServiceImplPackage', `${apiServicePackage}.impl`),
		invokerPackage: nullableConfigString(config, 'invokerPackage', `${packageName}.app`),
		invokerName: nullableConfigString(config, 'invokerName', 'RestApplication'),
		authenticationRequiredAnnotation: nullableConfigString(config, 'authenticationRequiredAnnotation', nullableConfigString(config, 'authenticatedOperationAnnotation', null)),
	}

	return result
}

export const createGenerator: CodegenGeneratorConstructor<JavaGeneratorContext> = (config, context) => {
	const myContext: JavaGeneratorContext = chainJavaGeneratorContext(context, {
		templates: hooks,
	})
	myContext.loadAdditionalTemplates = async(hbs) => {
		if (context.loadAdditionalTemplates) {
			await context.loadAdditionalTemplates(hbs)
		}
	}
	myContext.additionalWatchPaths = () => {
		return context.additionalWatchPaths ? context.additionalWatchPaths() : []
	}

	const generatorOptions = options(config, myContext)

	myContext.additionalExportTemplates = async(outputPath, doc, _hbs, rootContext) => {
		const relativeSourceOutputPath = generatorOptions.relativeSourceOutputPath
		const relativeApiSourceOutputPath = generatorOptions.relativeApiSourceOutputPath
		const relativeApiImplSourceOutputPath = generatorOptions.relativeApiImplSourceOutputPath

		const templates: EffectiveJavaJaxrsTemplates = { ...javaJaxrsCommonTemplates, ...myContext.templates }
		const ctx: ServerContext = {
			generatorContext: myContext,
			root: rootContext as ServerRootContext,
			templates,
		}

		const apiPackagePath = packageToPath(generatorOptions.apiPackage)
		for (const group of doc.groups) {
			if (!group.operations.length) {
				continue
			}
			await emitTemplate(api(group, ctx), path.join(outputPath, relativeApiSourceOutputPath, apiPackagePath, `${context.generator().toClassName(group.name)}Api.java`), true)
		}

		const apiImplPackagePath = packageToPath(generatorOptions.apiImplPackage)
		for (const group of doc.groups) {
			if (!group.operations.length) {
				continue
			}
			await emitTemplate(apiImpl(group, ctx), path.join(outputPath, relativeApiImplSourceOutputPath, apiImplPackagePath, `${context.generator().toClassName(group.name)}ApiImpl.java`), true)
		}

		const apiServicePackagePath = packageToPath(generatorOptions.apiServicePackage)
		for (const group of doc.groups) {
			if (!group.operations.length) {
				continue
			}
			await emitTemplate(apiService(group, ctx), path.join(outputPath, relativeApiImplSourceOutputPath, apiServicePackagePath, `${context.generator().toClassName(group.name)}ApiService.java`), true)
		}

		if (generatorOptions.apiServiceImplPackage) {
			const apiServiceImplPackagePath = packageToPath(generatorOptions.apiServiceImplPackage)
			for (const group of doc.groups) {
				if (!group.operations.length) {
					continue
				}
				await emitTemplate(apiServiceImpl(group, ctx), path.join(outputPath, relativeApiImplSourceOutputPath, apiServiceImplPackagePath, `${context.generator().toClassName(group.name)}ApiServiceImpl.java`), false)
			}
		}

		if (generatorOptions.apiParamsPackage) {
			const apiParamsPackagePath = packageToPath(generatorOptions.apiParamsPackage)
			for (const group of doc.groups) {
				for (const operation of group.operations) {
					if (operation.useParamsClasses) {
						await emitTemplate(apiParams(operation, ctx), path.join(outputPath, relativeApiSourceOutputPath, apiParamsPackagePath, `${context.generator().toClassName(operation.uniqueName)}Params.java`), true)
					}
				}
			}
		}

		const invokerPackagePath = generatorOptions.invokerPackage ? packageToPath(generatorOptions.invokerPackage) : undefined
		if (invokerPackagePath && generatorOptions.invokerName) {
			const basePath = apiBasePath(doc.servers)
			await emitTemplate(invoker(doc.groups, ctx), path.join(outputPath, relativeApiImplSourceOutputPath, invokerPackagePath, `Abstract${generatorOptions.invokerName}.java`), true)
			await emitTemplate(invokerImpl(basePath, ctx), path.join(outputPath, relativeApiImplSourceOutputPath, invokerPackagePath, `${generatorOptions.invokerName}.java`), false)
		}

		const providerPackagePath = generatorOptions.apiProviderPackage ? packageToPath(generatorOptions.apiProviderPackage) : undefined
		if (providerPackagePath) {
			await emitTemplate(abstractApiJaxbJsonProvider(ctx.root), path.join(outputPath, relativeApiImplSourceOutputPath, providerPackagePath, 'AbstractApiJaxbJsonProvider.java'), true)
			await emitTemplate(apiJaxbJsonProvider(ctx), path.join(outputPath, relativeApiImplSourceOutputPath, providerPackagePath, 'ApiJaxbJsonProvider.java'), false)
		}

		if (context.additionalExportTemplates) {
			await context.additionalExportTemplates(outputPath, doc, _hbs, rootContext)
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
		postProcessDocument: (doc, helper) => {
			if (base.postProcessDocument) {
				base.postProcessDocument(doc, helper)
			}

			/* Create response wrappers in order to support response headers */
			for (const group of doc.groups) {
				for (const operation of group.operations) {
					if (!operation.responses) {
						continue
					}

					for (const response of context.utils.values(operation.responses) as Iterable<MyResponse>) {
						if (response.headers && response.isDefault) {
							const headers = Array.from(context.utils.values(response.headers))
							if (headers.length > 0) {
								const wrapperName = `${context.generator().toClassName(operation.uniqueName)}DefaultResponse`
								const wrapperNativeType = new context.NativeType(`${generatorOptions.apiServicePackage}.${context.generator().toClassName(group.name)}ApiService.${wrapperName}`)
								const bodyNativeType = response.defaultContent?.nativeType || null

								response.__wrapper = {
									name: wrapperName,
									headers,
									bodyNativeType: bodyNativeType,
									nativeType: wrapperNativeType,
								}
								operation.returnNativeType = wrapperNativeType
							}
						} else {
							response.__wrapper = null
						}
					}
				}
			}
		},
	}
}

export default createGenerator
