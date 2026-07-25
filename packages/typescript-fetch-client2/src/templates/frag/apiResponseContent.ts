import { CodegenContent, CodegenHeader, CodegenResponse, CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { ts, each, identifier, stringLiteral, isContentJson, isBinary, isString, maybe } from '@openapi-generator-plus/template-utils'
import { DateApproach } from '@openapi-generator-plus/typescript-generator-common'
import { stringToSchema } from './stringToSchema'

export interface ApiResponseContentArgs {
	content: CodegenContent | null
	response: CodegenResponse
	dateApproach: DateApproach
	generatorContext: CodegenGeneratorContext
}

/**
 * The environment-specific parts of the response-content branch. Everything
 * else about the branch is shared between generators.
 */
export interface ApiResponseContentOptions {
	/** Expression that reads a binary response body, e.g. `await response.blob()`. */
	binaryBody: string
}

/**
 * Render the `headers:` block of a response object, converting each raw header
 * string to its schema's native type.
 */
export function responseHeaders(response: CodegenResponse, dateApproach: DateApproach, generatorContext: CodegenGeneratorContext) {
	return maybe(response.headers, headers => ts`
	headers: {
${each(headers, (h: CodegenHeader) => {
	const value = `response.headers.get(${stringLiteral(generatorContext, h.serializedName)})`
	return `		${identifier(generatorContext.generator(), h.name)}: ${value} ? ${stringToSchema(h, value, dateApproach)} ?? undefined : undefined,`
}, '\n')}
	},`)
}

/**
 * Build a renderer for the response-content branch — what runs inside
 * `if (mimeType === ...)` for each documented content type. Use this to make
 * an environment-specific variant by supplying the parts that differ; the
 * branch structure itself stays shared.
 */
export function makeApiResponseContent(options: ApiResponseContentOptions): (args: ApiResponseContentArgs) => string {
	const { binaryBody } = options
	return function apiResponseContent({ content, response, dateApproach, generatorContext }: ApiResponseContentArgs): string {
		const headersBlock = responseHeaders(response, dateApproach, generatorContext)

		if (!content) {
			return ts`
return {
	status: response.status,
	/* No content */
${headersBlock}
}`
		}

		return ts`
return {
	status: response.status,
	contentType: ${stringLiteral(generatorContext, content.mediaType.mimeType)},
${!content.schema ? '	/* No schema */'
	: isContentJson(content) ? `	body: await response.json() as ${content.nativeType},`
	: isBinary(content.schema) ? `	body: ${binaryBody},`
	: isString(content.schema) ? '	body: await response.text(),'
	: '	/* Unsupported mimeType for parsing */\n	response,'}
${headersBlock}
}`
	}
}

/**
 * The browser-flavoured default: binary bodies are read as a Blob.
 */
export const apiResponseContent = makeApiResponseContent({ binaryBody: 'await response.blob()' })
