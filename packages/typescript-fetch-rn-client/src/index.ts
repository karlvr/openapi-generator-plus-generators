import { CodegenGeneratorConstructor, CodegenGeneratorType } from '@openapi-generator-plus/types'
import typescriptGenerator, { FetchClientContext } from '@openapi-generator-plus/typescript-fetch-client-generator'
import { chainTypeScriptGeneratorContext } from '@openapi-generator-plus/typescript-generator-common'
import { hooks as rnHooks } from './templates/hooks'

const createGenerator: CodegenGeneratorConstructor = (config, context) => {
	const myContext: FetchClientContext = chainTypeScriptGeneratorContext(context, {})
	myContext.fetchClientHooks = rnHooks
	const base = typescriptGenerator(config, myContext)

	return {
		...base,
		templateRootContext: () => {
			return {
				...base.templateRootContext(),
				generatorClass: '@openapi-generator-plus/typescript-fetch-rn-client-generator',
			}
		},
		generatorType: () => CodegenGeneratorType.CLIENT,
	}
}

export default createGenerator
