import { ts } from '@openapi-generator-plus/template-utils'
import { FetchClientHooks } from '@openapi-generator-plus/typescript-fetch-client-generator'

/**
 * Hook overrides for fetch-rn-client: add the `abab` `btoa` polyfill that
 * React Native's JS engine doesn't provide natively.
 */
export const hooks: FetchClientHooks = {
	apiImports: () => ts`
import { btoa } from "abab";`,

	packageDependencies: () => [
		'"abab": "^2.0.5"',
	],
}
