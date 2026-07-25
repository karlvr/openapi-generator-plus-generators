import { ts } from '@openapi-generator-plus/template-utils'
import {
	FetchClient2Hooks,
	ApiResponseContentArgs,
	RootContext,
	makeApiResponseContent,
} from '@openapi-generator-plus/typescript-fetch-client-generator2'

/* Same branch structure as the browser default; only the binary read differs. */
const apiResponseContentNode = makeApiResponseContent({ binaryBody: 'Buffer.from(await response.arrayBuffer())' })

/**
 * Hook overrides for fetch-node-client2: replace fetch-client2's
 * browser-oriented imports/dependencies/response-body handling with the
 * Node-flavoured equivalents.
 */
export const hooks: FetchClient2Hooks = {
	apiImports: () => ts`
import { btoa } from "abab";
import { Buffer } from "buffer";
import { Headers, Response } from "node-fetch";
import type { RequestInit } from "node-fetch";
import { URLSearchParams } from "url";
import FormData from "form-data";`,

	indexImports: () => ts`
import type { RequestInit } from "node-fetch";
export type { RequestInit } from "node-fetch";`,

	modelsImports: () => 'import { Buffer } from "buffer";',

	packageDependencies: (_ctx: RootContext) => [
		'"abab": "^2.0.5"',
		'"form-data": "^4.0.0"',
		'"node-fetch": "^3.0.0"',
	],

	runtimeImports: () => ts`
import fetch, { Response } from "node-fetch";
import type { RequestInit } from "node-fetch";`,

	defaultFetch: () => 'export const defaultFetch = fetch;',

	apiResponseContent: (args: ApiResponseContentArgs) => apiResponseContentNode({
		content: args.content,
		response: args.response,
		dateApproach: args.rootContext.dateApproach,
		generatorContext: args.generatorContext,
	}),
}
