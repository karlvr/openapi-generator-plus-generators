import path from 'path'
import { CodegenGeneratorConstructor } from '@openapi-generator-plus/types'
import { emit } from '@openapi-generator-plus/template-utils'
import javaGenerator, { options as javaGeneratorOptions, packageToPath } from '@openapi-generator-plus/java-jaxrs-server-generator'
import { JavaGeneratorContext, chainJavaGeneratorContext, RootContext } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { hooks } from './templates/hooks'
import { beansXml } from './templates/beansXml'
import { testConfiguration } from './templates/testConfiguration'

export const createGenerator: CodegenGeneratorConstructor<JavaGeneratorContext> = (config, context) => {
	const myContext: JavaGeneratorContext = chainJavaGeneratorContext(context, {
		templates: hooks,
	})

	const generatorOptions = javaGeneratorOptions(config, myContext)

	myContext.additionalExportTemplates = async(outputPath, doc, hbs, rootContext) => {
		const root = rootContext as RootContext

		const relativeResourcesOutputPath = generatorOptions.relativeResourcesOutputPath
		if (relativeResourcesOutputPath) {
			await emit(beansXml(), path.join(outputPath, relativeResourcesOutputPath, 'META-INF', 'beans.xml'), false)
		}

		if (generatorOptions.includeTests) {
			const relativeTestOutputPath = generatorOptions.relativeTestOutputPath
			const apiPackagePath = packageToPath(generatorOptions.apiPackage)

			await emit(testConfiguration(root), path.join(outputPath, relativeTestOutputPath, apiPackagePath, 'TestConfiguration.java'), false)
		}

		if (context.additionalExportTemplates) {
			await context.additionalExportTemplates(outputPath, doc, hbs, rootContext)
		}
	}

	const aJavaGenerator = javaGenerator(config, myContext)
	return {
		...aJavaGenerator,
		templateRootContext: () => {
			return {
				...aJavaGenerator.templateRootContext(),
				...generatorOptions,
				generatorClass: '@openapi-generator-plus/java-cxf-cdi-server-generator',
			}
		},
	}
}

export default createGenerator
