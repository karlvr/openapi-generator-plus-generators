import { CodegenContent, CodegenResponse, CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { ts, each, identifier, stringLiteral, isContentJson, isBinary, isString } from '@openapi-generator-plus/template-utils'

export interface ApiResponseContentArgs {
	content: CodegenContent | null
	response: CodegenResponse
	generatorContext: CodegenGeneratorContext
}

/**
 * Default implementation of the response-content branch — what runs inside
 * `if (mimeType === ...)` for each documented content type. Child generators
 * (e.g. fetch-node-client2) override via the `apiResponseContent` hook to swap
 * `response.blob()` for a Buffer-based read.
 */
export function apiResponseContent({ content, response, generatorContext }: ApiResponseContentArgs): string {
	const headersBlock = response.headers ? ts`	headers: {
${each(response.headers, (h) => `		${identifier(generatorContext.generator(), h.name)}: response.headers.get(${stringLiteral(generatorContext, h.serializedName)}) ?? undefined,`, '\n')}
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
		bodyBlock = `	body: await response.blob(),`
	} else if (isString(content.schema)) {
		bodyBlock = `	body: await response.text(),`
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
