import { ts, each, identifier, stringLiteral, isContentJson, isBinary, isString } from '@openapi-generator-plus/template-utils'
import {
	FetchClient2Hooks,
	ApiResponseContentArgs,
	RootContext,
} from '@openapi-generator-plus/typescript-fetch-client-generator2'

/**
 * Hook overrides for fetch-node-client2: replace fetch-client2's
 * browser-oriented imports/dependencies/response-body handling with the
 * Node-flavoured equivalents.
 */
export const hooks: FetchClient2Hooks = {
	apiImports: () => ts`import { btoa } from "abab";
import { Buffer } from "buffer";
import { Headers, Response } from "node-fetch";
import type { RequestInit } from "node-fetch";
import { URLSearchParams } from "url";
import FormData from "form-data";`,

	indexImports: () => ts`import type { RequestInit } from "node-fetch";
export type { RequestInit } from "node-fetch";`,

	modelsImports: () => 'import { Buffer } from "buffer";',

	packageDependencies: (_ctx: RootContext) => [
		'"abab": "^2.0.5"',
		'"form-data": "^4.0.0"',
		'"node-fetch": "^3.0.0"',
	],

	runtimeImports: () => ts`import fetch, { Response } from "node-fetch";
import type { RequestInit } from "node-fetch";`,

	defaultFetch: () => 'export const defaultFetch = fetch;',

	apiResponseContent: (args: ApiResponseContentArgs) => apiResponseContentNode(args),
}

function apiResponseContentNode({ content, response, generatorContext }: ApiResponseContentArgs): string {
	const headersBlock = response.headers ? ts`	headers: {
${each(response.headers, (h: { name: string; serializedName: string }) => `		${identifier(generatorContext.generator(), h.name)}: response.headers.get(${stringLiteral(generatorContext, h.serializedName)}) ?? undefined,`, '\n')}
	},` : null

	if (!content) {
		return ts`return {
	status: response.status,
	/* No content */
${headersBlock}
}`
	}

	let bodyBlock: string
	if (!content.schema) {
		bodyBlock = '	/* No schema */'
	} else if (isContentJson(content)) {
		bodyBlock = `	body: await response.json() as ${content.nativeType},`
	} else if (isBinary(content.schema)) {
		bodyBlock = '	body: Buffer.from(await response.arrayBuffer()),'
	} else if (isString(content.schema)) {
		bodyBlock = '	body: await response.text(),'
	} else {
		bodyBlock = '	/* Unsupported mimeType for parsing */\n	response,'
	}

	return ts`return {
	status: response.status,
	contentType: ${stringLiteral(generatorContext, content.mediaType.mimeType)},
${bodyBlock}
${headersBlock}
}`
}
