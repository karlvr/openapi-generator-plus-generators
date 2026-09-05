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
 * How this client reads a response body of a given content.
 *
 * `none` means the content declares no schema, so there is nothing to read. `unsupported`
 * means the client cannot parse the media type and returns the raw response instead.
 */
type ResponseBodyHandling = 'none' | 'json' | 'binary' | 'text' | 'unsupported'

function responseBodyHandling(content: CodegenContent): ResponseBodyHandling {
	if (!content.schema) {
		return 'none'
	}
	if (isContentJson(content)) {
		return 'json'
	}
	if (isBinary(content.schema)) {
		return 'binary'
	}
	if (isString(content.schema)) {
		return 'text'
	}
	return 'unsupported'
}

/**
 * Whether this client can parse a response body with this content.
 *
 * The client parses JSON media types, and any media type whose schema is binary or string.
 * Content with no schema needs no parsing. Any other content, for example XML with an object
 * schema, comes back as the raw response.
 *
 * Use this to decide what an operation may advertise in its `Accept` header. This predicate
 * and the response-content branch share one classification, so the two cannot disagree.
 */
export function canParseContent(content: CodegenContent): boolean {
	return responseBodyHandling(content) !== 'unsupported'
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

/** The response object's body line for one content, indented to sit inside the object literal. */
function responseBody(content: CodegenContent, binaryBody: string): string {
	switch (responseBodyHandling(content)) {
		case 'none':
			return '\t/* No schema */'
		case 'json':
			return `\tbody: await response.json() as ${content.nativeType},`
		case 'binary':
			return `\tbody: ${binaryBody},`
		case 'text':
			return '\tbody: await response.text(),'
		case 'unsupported':
			return '\t/* Unsupported mimeType for parsing */\n\tresponse,'
	}
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
${responseBody(content, binaryBody)}
${headersBlock}
}`
	}
}

/**
 * The browser-flavoured default: binary bodies are read as a Blob.
 */
export const apiResponseContent = makeApiResponseContent({ binaryBody: 'await response.blob()' })
