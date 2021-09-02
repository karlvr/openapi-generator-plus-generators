import { CodegenGeneratorConstructor, CodegenGeneratorType, isCodegenEnumSchema, isCodegenObjectSchema } from '@openapi-generator-plus/types'
import path from 'path'
import { loadTemplates, emit } from '@openapi-generator-plus/handlebars-templates'
import typescriptGenerator, { options as typescriptCommonOptions, TypeScriptGeneratorContext, chainTypeScriptGeneratorContext } from '@openapi-generator-plus/typescript-generator-common'
import { CodegenOptionsTypeScriptFetchClient } from './types'
import * as idx from '@openapi-generator-plus/indexed-type'

const createGenerator: CodegenGeneratorConstructor = (config, context) => {
	const myContext: TypeScriptGeneratorContext = chainTypeScriptGeneratorContext(context, {
		loadAdditionalTemplates: async(hbs) => {
			await loadTemplates(path.resolve(__dirname, '../templates'), hbs)
		},
		additionalWatchPaths: () => {
			return [path.resolve(__dirname, '../templates')]
		},
		defaultNpmOptions: () => ({
			name: 'typescript-fetch-api',
			version: '0.0.1',
			private: true,
			repository: null,
		}),
		defaultTypeScriptOptions: () => ({
			target: 'ES5',
			libs: ['$target', 'DOM'],
		}),
	})

	const generatorOptions: CodegenOptionsTypeScriptFetchClient = {
		...typescriptCommonOptions(config, myContext),
		legacyUnnamespacedModelSupport: !!config.legacyUnnamespacedModelSupport,
		withInterfaces: !!config.withInterfaces,
	}

	myContext.additionalExportTemplates = async(outputPath, doc, hbs, rootContext) => {
		const relativeSourceOutputPath = generatorOptions.relativeSourceOutputPath
		await emit('api', path.join(outputPath, relativeSourceOutputPath, 'api.ts'), { ...rootContext, ...doc }, true, hbs)
		await emit('models', path.join(outputPath, relativeSourceOutputPath, 'models.ts'), {
			...rootContext,
			...doc,
			models: idx.filter(doc.schemas, schema => isCodegenObjectSchema(schema) || isCodegenEnumSchema(schema)), // TODO this quality will become part of the generator interface
		}, true, hbs)
		await emit('runtime', path.join(outputPath, relativeSourceOutputPath, 'runtime.ts'), { ...rootContext, ...doc }, true, hbs)
		await emit('configuration', path.join(outputPath, relativeSourceOutputPath, 'configuration.ts'), { ...rootContext, ...doc }, true, hbs)
		await emit('index', path.join(outputPath, relativeSourceOutputPath, 'index.ts'), { ...rootContext, ...doc }, true, hbs)
		await emit('README', path.join(outputPath, 'README.md'), { ...rootContext, ...doc }, true, hbs)
	}

	const base = typescriptGenerator(config, myContext)

	return {
		...base,
		templateRootContext: () => {
			return {
				...base.templateRootContext(),
				...generatorOptions,
				generatorClass: '@openapi-generator-plus/typescript-fetch-client-generator',
			}
		},
		generatorType: () => CodegenGeneratorType.CLIENT,
		toNativeType: function(options) {
			const { type, format } = options
			if (type === 'string' && format === 'binary') {
				/* We support string and Blob, which is what FormData supports. It also enables us to handle literal binary values
				   created from strings... which is hopefully a good idea.
				 */
				return new context.NativeType('string | Blob')
			} else {
				return base.toNativeType(options)
			}
		},
	}
}

export default createGenerator

