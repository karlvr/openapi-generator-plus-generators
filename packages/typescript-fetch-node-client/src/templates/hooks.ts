import { ts } from '@openapi-generator-plus/template-utils'
import {
	FetchClientHooks,
	RootContext,
	makeApiResponseContent,
} from '@openapi-generator-plus/typescript-fetch-client-generator'

/* Same branch structure as the browser default; only the binary read differs. */
const apiResponseContentNode = makeApiResponseContent({ binaryBody: 'response.buffer()' })

/**
 * Hook overrides for fetch-node-client: replace fetch-client's
 * browser-oriented imports/dependencies/response-body handling with the
 * Node-flavoured equivalents.
 */
export const hooks: FetchClientHooks = {
	apiImports: () => ts`
import { btoa } from "abab";
import { Buffer } from "buffer";
import { Headers, RequestInit, Response } from "node-fetch";
import { URLSearchParams } from "url";
import FormData from "form-data";`,

	modelsImports: () => 'import { Buffer } from "buffer";',

	packageDependencies: (_ctx: RootContext) => [
		'"abab": "^2.0.5"',
		'"form-data": "^4.0.0"',
		'"node-fetch": "^3.0.0"',
	],

	runtimeImports: () => ts`
import fetch, { RequestInit, Response } from "node-fetch";
export const defaultFetch = fetch;`,

	apiResponseContent: apiResponseContentNode,
}
