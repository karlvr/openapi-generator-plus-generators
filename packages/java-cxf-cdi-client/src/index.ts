import { CodegenGeneratorConstructor } from '@openapi-generator-plus/types'
import path from 'path'
import { loadTemplates, emit } from '@openapi-generator-plus/handlebars-templates'
import javaGenerator, { packageToPath, CodegenOptionsJavaClient } from '@openapi-generator-plus/java-jaxrs-client-generator'
import { CodegenOptionsCxfCdiClient } from './types'

export const createGenerator: CodegenGeneratorConstructor<CodegenOptionsCxfCdiClient> = (context) => ({
	...javaGenerator<CodegenOptionsCxfCdiClient>({
		...context,
		loadAdditionalTemplates: async(hbs) => {
			await loadTemplates(path.resolve(__dirname, '../templates'), hbs)
		},
		additionalWatchPaths: () => {
			return [path.resolve(__dirname, '../templates')]
		},
		customiseRootContext: async(rootContext) => {
			rootContext.generatorClass = '@openapi-generator-plus/java-cxf-cdi-client-generator'
		},
		additionalExportTemplates: async(outputPath, doc, hbs, rootContext, state) => {
			const relativeResourcesOutputPath = state.options.relativeResourcesOutputPath
			if (relativeResourcesOutputPath) {
				await emit('beans.xml', path.join(outputPath, relativeResourcesOutputPath, 'META-INF', 'beans.xml'), { ...state.options, ...rootContext }, false, hbs)
			}

			const relativeSourceOutputPath = state.options.relativeSourceOutputPath
			const invokerPackagePath = state.options.invokerPackage && packageToPath(state.options.invokerPackage)
			const invokerImplPackagePath = state.options.invokerImplPackage && packageToPath(state.options.invokerImplPackage)

			if (invokerPackagePath) {
				await emit('ClientApi', path.join(outputPath, relativeSourceOutputPath, invokerPackagePath, 'ClientApi.java'), {
					...state.options, 
					...rootContext,
					apis: doc.groups,
				}, true, hbs)
				await emit('ClientApiProviders', path.join(outputPath, relativeSourceOutputPath, invokerPackagePath, 'ClientApiProviders.java'), {
					...state.options, 
					...rootContext,
				}, true, hbs)
			}
			if (invokerImplPackagePath) {
				await emit('DefaultClientApi', path.join(outputPath, relativeSourceOutputPath, invokerImplPackagePath, 'DefaultClientApi.java'), {
					...state.options, 
					...rootContext,
					apis: doc.groups,
					server: doc.servers && doc.servers.length ? doc.servers[0] : undefined,
				}, true, hbs)
				await emit('DefaultClientApiProviders', path.join(outputPath, relativeSourceOutputPath, invokerImplPackagePath, 'DefaultClientApiProviders.java'), {
					...state.options, 
					...rootContext,
				}, false, hbs)
			}
		},
		transformOptions: (config, options) => {
			const packageName = config.package || 'com.example'
			const invokerPackage = config.invokerPackage === null ? null : config.invokerPackage || `${config.apiPackage || packageName}.invoker`

			const result: CodegenOptionsCxfCdiClient = {
				...options,
				invokerPackage,
				invokerImplPackage: config.invokerImplPackage === null ? null : config.invokerImplPackage || `${invokerPackage}.impl`,
			}

			return result
		},
	}),
})

export default createGenerator
