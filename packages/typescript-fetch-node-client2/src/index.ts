import { CodegenGeneratorConstructor, CodegenGeneratorType, CodegenSchemaType } from '@openapi-generator-plus/types'
import typescriptGenerator, { FetchClient2Context } from '@openapi-generator-plus/typescript-fetch-client-generator2'
import { chainTypeScriptGeneratorContext } from '@openapi-generator-plus/typescript-generator-common'
import { hooks as nodeHooks } from './templates/hooks'

const createGenerator: CodegenGeneratorConstructor = (config, context) => {
	const myContext: FetchClient2Context = chainTypeScriptGeneratorContext(context, {
		defaultTypeScriptOptions: () => ({
			target: 'ES5',
			libs: ['$target', 'DOM', 'ES2021.String'],
		}),
	})
	myContext.fetchClient2Hooks = nodeHooks
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
			if (schemaType === CodegenSchemaType.BINARY || schemaType === CodegenSchemaType.FILE) {
				return new context.NativeType('string | Buffer')
			} else {
				return base.toNativeType(options)
			}
		},
	}
}

export default createGenerator
