import { ts } from '@openapi-generator-plus/template-utils'
import { defaultPackageDependencies, FetchClientHooks } from '@openapi-generator-plus/typescript-fetch-client-generator'

/**
 * Hook overrides for fetch-rn-client: add the `abab` `btoa` polyfill that
 * React Native's JS engine doesn't provide natively.
 */
export const hooks: FetchClientHooks = {
	apiImports: () => ts`
import { btoa } from "abab";`,

	packageDependencies: (ctx) => [
		...defaultPackageDependencies(ctx),
		'"abab": "^2.0.5"',
	],
}
