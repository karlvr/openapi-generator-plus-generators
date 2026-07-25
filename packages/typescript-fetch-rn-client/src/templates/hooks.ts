import { ts } from '@openapi-generator-plus/template-utils'
import { FetchClientHooks } from '@openapi-generator-plus/typescript-fetch-client-generator'

/**
 * Hook overrides for fetch-rn-client: add the `abab` `btoa` polyfill that
 * React Native's JS engine doesn't provide natively.
 */
export const hooks: FetchClientHooks = {
	apiImports: () => ts`
import { btoa } from "abab";`,

	/*
	 * The trailing comma is intentional: the Handlebars original baked it
	 * into the single-line partial it emitted, so with only one dependency
	 * here `join()` never gets a chance to add one. Kept to match that
	 * historical output exactly.
	 */
	packageDependencies: () => [
		'"abab": "^2.0.5",',
	],
}
