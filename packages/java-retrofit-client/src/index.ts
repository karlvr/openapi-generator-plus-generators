import { CodegenConfig, CodegenGenerator, CodegenGeneratorType } from '@openapi-generator-plus/types'
import path from 'path'
import { emit as emitTemplate } from '@openapi-generator-plus/template-utils'
import javaGenerator, {
	apiConstants,
	chainJavaGeneratorContext,
	CodegenOptionsJava,
	EffectiveJavaJaxrsTemplates,
	JavaGeneratorContext,
	JavaModelContext,
	javaJaxrsCommonTemplates,
	options as javaGeneratorOptions,
	packageToPath,
	RootContext,
} from '@openapi-generator-plus/java-jaxrs-generator-common'
import { hooks } from './templates/hooks'
import { api } from './templates/api'
import { apiConverterFactory, encodedRequestBodies } from './templates/ApiConverterFactory'
import { apiObjectMapper } from './templates/ApiObjectMapper'

/**
 * The configuration to build on, which is the caller's configuration over this generator's
 * own defaults.
 *
 * A JAX-RS provider has nothing to register with in a Retrofit project, and Retrofit declares
 * each parameter on its own interface method. So neither a provider nor a parameters class is
 * generated. A caller who names either package gets them anyway.
 */
function effectiveConfig(config: CodegenConfig): CodegenConfig {
	return {
		apiProviderPackage: null,
		apiParamsPackage: null,
		...config,
	}
}

/**
 * This generator's options.
 *
 * A Retrofit project needs nothing beyond the options that every Java project in this family
 * takes.
 */
export function options(config: CodegenConfig, context: JavaGeneratorContext): CodegenOptionsJava {
	return javaGeneratorOptions(effectiveConfig(config), context)
}

export default function createGenerator(config: CodegenConfig, context: JavaGeneratorContext): CodegenGenerator {
	const myContext: JavaGeneratorContext = chainJavaGeneratorContext(context, {
		templates: hooks,
	})

	/*
	 * This generator encodes a form body itself, one property at a time, so it keeps the
	 * request model that the specification describes.
	 */
	myContext.formUrlEncodedImplementation = () => null

	const generatorOptions = options(config, myContext)

	myContext.exportFiles = async(outputPath, doc, rootContext) => {
		const templates: EffectiveJavaJaxrsTemplates = { ...javaJaxrsCommonTemplates, ...myContext.templates }
		const ctx: JavaModelContext = {
			generatorContext: myContext,
			root: rootContext as RootContext,
			templates,
		}

		const apiPackagePath = packageToPath(generatorOptions.apiPackage)

		for (const group of doc.groups) {
			if (!group.operations.length) {
				continue
			}
			const name = `${context.generator().toClassName(group.name)}Api.java`
			const content = templates.api ? templates.api(group, ctx) : api(group, ctx)
			await emitTemplate(content, path.join(outputPath, generatorOptions.relativeApiSourceOutputPath, apiPackagePath, name), true)
		}

		const sourcePath = path.join(outputPath, generatorOptions.relativeSourceOutputPath, apiPackagePath)
		await emitTemplate(apiConstants(doc.servers, ctx), path.join(sourcePath, 'ApiConstants.java'), true)
		await emitTemplate(apiObjectMapper(ctx.root), path.join(sourcePath, 'ApiObjectMapper.java'), true)
		await emitTemplate(apiConverterFactory(encodedRequestBodies(doc.groups), ctx), path.join(sourcePath, 'ApiConverterFactory.java'), true)

		if (context.exportFiles) {
			await context.exportFiles(outputPath, doc, rootContext)
		}
	}

	myContext.additionalCleanPathPatterns = () => {
		const result = [
			path.join(generatorOptions.relativeApiSourceOutputPath, packageToPath(generatorOptions.apiPackage), '*Api.java'),
		]
		if (context.additionalCleanPathPatterns) {
			result.push(...context.additionalCleanPathPatterns())
		}
		return result
	}

	const base = javaGenerator(effectiveConfig(config), myContext)
	return {
		...base,
		templateRootContext: () => {
			return {
				...base.templateRootContext(),
				...generatorOptions,
				generatorClass: '@openapi-generator-plus/java-retrofit-client-generator',
			}
		},
		generatorType: () => CodegenGeneratorType.CLIENT,
	}
}

export { createGenerator }
