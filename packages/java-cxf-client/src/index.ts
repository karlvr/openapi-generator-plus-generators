import { CodegenGeneratorConstructor } from '@openapi-generator-plus/types'
import path from 'path'
import { emit, loadTemplates } from '@openapi-generator-plus/handlebars-templates'
import javaGenerator, { options as javaGeneratorOptions } from '@openapi-generator-plus/java-jaxrs-client-generator'
import { packageToPath, JavaGeneratorContext } from '@openapi-generator-plus/java-jaxrs-generator-common'

export const createGenerator: CodegenGeneratorConstructor = (config, context: JavaGeneratorContext) => {
	const myContext: JavaGeneratorContext = {
		...context,
		loadAdditionalTemplates: async(hbs) => {
			await loadTemplates(path.resolve(__dirname, '../templates'), hbs)
		},
		additionalWatchPaths: () => {
			return [path.resolve(__dirname, '../templates')]
		},
		customiseRootContext: async(rootContext) => {
			rootContext.generatorClass = '@openapi-generator-plus/java-cxf-client-generator'
		},
	}

	const generatorOptions = javaGeneratorOptions(config, myContext)

	myContext.additionalExportTemplates = async(outputPath, doc, hbs, rootContext) => {
		const relativeSourceOutputPath = generatorOptions.relativeSourceOutputPath
		const apiPackagePath = packageToPath(generatorOptions.apiPackage)

		await emit('ApiProviders', path.join(outputPath, relativeSourceOutputPath, apiPackagePath, 'ApiProviders.java'), {
			servers: doc.servers, server: doc.servers && doc.servers.length ? doc.servers[0] : undefined, ...generatorOptions, ...rootContext,
		}, false, hbs)

		if (context.additionalExportTemplates) {
			context.additionalExportTemplates(outputPath, doc, hbs, rootContext)
		}
	}

	return {
		...javaGenerator(config, myContext),
	}
}

export default createGenerator
