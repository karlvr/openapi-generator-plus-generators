import { CodegenGeneratorType, CodegenGenerator, CodegenConfig } from '@openapi-generator-plus/types'
import path from 'path'
import { emit as emitTemplate } from '@openapi-generator-plus/template-utils'
import javaGenerator, { options as javaGeneratorOptions, packageToPath, JavaGeneratorContext, chainJavaGeneratorContext, javaJaxrsCommonTemplates, EffectiveJavaJaxrsTemplates, apiParams } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { CodegenOptionsJavaClient } from './types'
import { configBoolean, configNumber, configString } from '@openapi-generator-plus/generator-common'
import { hooks } from './templates/hooks'
import { ClientContext, ClientRootContext } from './templates/types'
import { api } from './templates/api'
import { apiImpl } from './templates/apiImpl'
import { apiSpec } from './templates/apiSpec'
import { apiConstants } from './templates/ApiConstants'
import { apiInvoker } from './templates/ApiInvoker'
import { apiProvidersInterface } from './templates/ApiProviders'
import { unexpectedApiException } from './templates/UnexpectedApiException'
import { unexpectedApiProcessingException } from './templates/UnexpectedApiProcessingException'
import { unexpectedResponseException } from './templates/UnexpectedResponseException'
import { unprocessableResponseException } from './templates/UnprocessableResponseException'
import { unexpectedTimeoutException } from './templates/UnexpectedTimeoutException'
import { apiAuthorizationProvider } from './templates/spi/ApiAuthorizationProvider'
export { CodegenOptionsJavaClient } from './types'
export { packageToPath } from '@openapi-generator-plus/java-jaxrs-generator-common'
export { ClientContext, ClientRootContext } from './templates/types'
export { bodyParam } from './templates/frag/bodyParam'
export { exceptionName } from './templates/api'

export function options(config: CodegenConfig, context: JavaGeneratorContext): CodegenOptionsJavaClient {
	const parentOptions = javaGeneratorOptions(config, context)
	const generatorOptions: CodegenOptionsJavaClient = {
		...parentOptions,
		apiSpecPackage: configString(config, 'apiSpecPackage', `${parentOptions.apiPackage}.spec`),
		apiSpiPackage: configString(config, 'apiSpiPackage', `${parentOptions.apiPackage}.spi`),
		connectionTimeoutMillis: configNumber(config, 'connectionTimeoutMillis', 30000),
		receiveTimeoutMillis: configNumber(config, 'receiveTimeoutMillis', 60000),
		useRuntimeUnexpectedExceptions: configBoolean(config, 'useRuntimeUnexpectedExceptions', false),
	}
	return generatorOptions
}

export default function createGenerator(config: CodegenConfig, context: JavaGeneratorContext): CodegenGenerator {
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
	// eslint-disable-next-line @typescript-eslint/no-use-before-define
	myContext.formUrlEncodedImplementation = () => new context.NativeType(`${generatorOptions.useJakarta ? 'jakarta' : 'javax'}.ws.rs.core.Form`)

	const generatorOptions = options(config, myContext)

	myContext.additionalExportTemplates = async(outputPath, doc, _hbs, rootContext) => {
		const relativeSourceOutputPath = generatorOptions.relativeSourceOutputPath
		const relativeApiSourceOutputPath = generatorOptions.relativeApiSourceOutputPath
		const relativeApiImplSourceOutputPath = generatorOptions.relativeApiImplSourceOutputPath

		const templates: EffectiveJavaJaxrsTemplates = { ...javaJaxrsCommonTemplates, ...myContext.templates }
		const ctx: ClientContext = {
			generatorContext: myContext,
			root: rootContext as ClientRootContext,
			templates,
		}

		const apiPackagePath = packageToPath(generatorOptions.apiPackage)

		for (const group of doc.groups) {
			if (!group.operations.length) {
				continue
			}
			const apiContent = templates.api ? templates.api(group, ctx) : api(group, ctx)
			await emitTemplate(apiContent, path.join(outputPath, relativeApiSourceOutputPath, apiPackagePath, `${context.generator().toClassName(group.name)}Api.java`), true)
		}

		const apiImplPackagePath = packageToPath(generatorOptions.apiImplPackage)
		for (const group of doc.groups) {
			if (!group.operations.length) {
				continue
			}
			await emitTemplate(apiImpl(group, ctx), path.join(outputPath, relativeApiImplSourceOutputPath, apiImplPackagePath, `${context.generator().toClassName(group.name)}ApiImpl.java`), true)
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

		await emitTemplate(apiConstants(doc.servers, ctx), path.join(outputPath, relativeSourceOutputPath, apiPackagePath, 'ApiConstants.java'), true)
		await emitTemplate(apiInvoker(ctx), path.join(outputPath, relativeApiImplSourceOutputPath, apiPackagePath, 'ApiInvoker.java'), true)
		await emitTemplate(apiProvidersInterface(ctx.root), path.join(outputPath, relativeApiImplSourceOutputPath, apiPackagePath, 'ApiProviders.java'), true)

		const apiSpecPackagePath = packageToPath(generatorOptions.apiSpecPackage)
		for (const group of doc.groups) {
			if (!group.operations.length) {
				continue
			}
			await emitTemplate(apiSpec(group, ctx), path.join(outputPath, relativeApiImplSourceOutputPath, apiSpecPackagePath, `${context.generator().toClassName(group.name)}ApiSpec.java`), true)
		}

		await emitTemplate(unexpectedApiException(ctx.root), path.join(outputPath, relativeApiImplSourceOutputPath, apiPackagePath, 'UnexpectedApiException.java'), true)
		await emitTemplate(unexpectedApiProcessingException(ctx.root), path.join(outputPath, relativeApiImplSourceOutputPath, apiPackagePath, 'UnexpectedApiProcessingException.java'), true)
		await emitTemplate(unexpectedResponseException(ctx.root), path.join(outputPath, relativeApiImplSourceOutputPath, apiPackagePath, 'UnexpectedResponseException.java'), true)
		await emitTemplate(unprocessableResponseException(ctx.root), path.join(outputPath, relativeApiImplSourceOutputPath, apiPackagePath, 'UnprocessableResponseException.java'), true)
		await emitTemplate(unexpectedTimeoutException(ctx.root), path.join(outputPath, relativeApiImplSourceOutputPath, apiPackagePath, 'UnexpectedTimeoutException.java'), true)

		const apiSpiPackagePath = packageToPath(generatorOptions.apiSpiPackage)
		await emitTemplate(apiAuthorizationProvider(ctx.root), path.join(outputPath, relativeApiImplSourceOutputPath, apiSpiPackagePath, 'ApiAuthorizationProvider.java'), true)

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
		const apiSpecPackagePath = packageToPath(generatorOptions.apiSpecPackage)
		const result = [
			path.join(relativeApiSourceOutputPath, apiPackagePath, '*Api.java'),
			path.join(relativeApiImplSourceOutputPath, apiImplPackagePath, '*ApiImpl.java'),
			path.join(relativeApiImplSourceOutputPath, apiSpecPackagePath, '*ApiSpec.java'),
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
				generatorClass: '@openapi-generator-plus/java-jaxrs-client-generator',
			}
		},
		generatorType: () => CodegenGeneratorType.CLIENT,
	}
}
