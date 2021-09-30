import { CodegenGeneratorConstructor, CodegenGeneratorType, CodegenSchemaType } from '@openapi-generator-plus/types'
import path from 'path'
import { loadTemplates } from '@openapi-generator-plus/handlebars-templates'
import typescriptGenerator from '@openapi-generator-plus/typescript-fetch-client-generator'
import { TypeScriptGeneratorContext, chainTypeScriptGeneratorContext } from '@openapi-generator-plus/typescript-generator-common'

const createGenerator: CodegenGeneratorConstructor = (config, context) => {
	const myContext: TypeScriptGeneratorContext = chainTypeScriptGeneratorContext(context, {
		loadAdditionalTemplates: async(hbs) => {
			await loadTemplates(path.resolve(__dirname, '../templates'), hbs)
		},
		additionalWatchPaths: () => {
			return [path.resolve(__dirname, '../templates')]
		},
		defaultTypeScriptOptions: () => ({
			target: 'ES5',
			libs: ['$target'],
		}),
	})
	const base = typescriptGenerator(config, myContext)

	return {
		...base,
		templateRootContext: () => {
			return {
				...base.templateRootContext(),
				generatorClass: '@openapi-generator-plus/typescript-fetch-node-client-generator',
			}
		},
		generatorType: () => CodegenGeneratorType.CLIENT,
		toNativeType: function(options) {
			const { schemaType } = options
			if (schemaType === CodegenSchemaType.BINARY) {
				return new context.NativeType('string | Buffer')
			} else {
				return base.toNativeType(options)
			}
		},
	}
}

export default createGenerator
