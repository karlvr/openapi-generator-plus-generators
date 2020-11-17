import { CodegenGeneratorConstructor } from '@openapi-generator-plus/types'
import path from 'path'
import { loadTemplates, emit } from '@openapi-generator-plus/handlebars-templates'
import javaGenerator, { options as javaGeneratorOptions, packageToPath } from '@openapi-generator-plus/java-jaxrs-server-generator'
import { JavaGeneratorContext } from '@openapi-generator-plus/java-jaxrs-generator-common'

export const createGenerator: CodegenGeneratorConstructor<JavaGeneratorContext> = (config, context) => {
	const myContext: JavaGeneratorContext = {
		...context,
		loadAdditionalTemplates: async(hbs) => {
			await loadTemplates(path.resolve(__dirname, '../templates'), hbs)
		},
		additionalWatchPaths: () => {
			return [path.resolve(__dirname, '../templates')]
		},
		customiseRootContext: async(rootContext) => {
			rootContext.generatorClass = '@openapi-generator-plus/java-cxf-cdi-server-generator'
		},
	}

	const generatorOptions = javaGeneratorOptions(config, myContext)

	myContext.additionalExportTemplates = async(outputPath, doc, hbs, rootContext) => {
		const relativeResourcesOutputPath = generatorOptions.relativeResourcesOutputPath
		if (relativeResourcesOutputPath) {
			await emit('beans.xml', path.join(outputPath, relativeResourcesOutputPath, 'META-INF', 'beans.xml'), { ...generatorOptions, ...rootContext }, false, hbs)
		}

		if (generatorOptions.includeTests) {
			const relativeTestOutputPath = generatorOptions.relativeTestOutputPath
			const apiPackagePath = packageToPath(generatorOptions.apiPackage)

			await emit('tests/TestConfiguration', path.join(outputPath, relativeTestOutputPath, apiPackagePath, 'TestConfiguration.java'), { ...generatorOptions, ...rootContext }, false, hbs)
		}
	}

	return {
		...javaGenerator(config, myContext),
	}
}

export default createGenerator
