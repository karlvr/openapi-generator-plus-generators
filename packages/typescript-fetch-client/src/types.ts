import { CodegenOptionsTypeScript } from '@openapi-generator-plus/typescript-generator-common'

/**
 * Options specific to the template that the user can provide to the code generation process.
 */
export interface CodegenOptionsTypeScriptFetchClient extends CodegenOptionsTypeScript {
	legacyUnnamespacedModelSupport: boolean
	withInterfaces: boolean
	/**
	 * Whether polyfills should be included for features that browsers might not have, or might not do well.
	 */
	includePolyfills: boolean
}
