import { CodegenGeneratorConstructor, CodegenGeneratorType } from '@openapi-generator-plus/types'
import typescriptGenerator, { FetchClientContext } from '@openapi-generator-plus/typescript-fetch-client-generator'
import { chainTypeScriptGeneratorContext } from '@openapi-generator-plus/typescript-generator-common'
import { hooks as rnHooks } from './templates/hooks'

const createGenerator: CodegenGeneratorConstructor = (config, context) => {
	const myContext: FetchClientContext = chainTypeScriptGeneratorContext(context, {})
	myContext.fetchClientHooks = rnHooks

	/*
	 * React Native provides `fetch`, so the polyfill is off by default here. A
	 * caller who turns it on gets both the import and the dependency.
	 */
	const base = typescriptGenerator({ includePolyfills: false, ...config }, myContext)

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
