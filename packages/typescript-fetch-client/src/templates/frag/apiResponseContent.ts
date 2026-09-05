import { CodegenContent } from '@openapi-generator-plus/types'
import { isContentJson, isBinary, isString } from '@openapi-generator-plus/template-utils'

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
	/** Expression that reads a binary response body, e.g. `response.blob()`. */
	binaryBody: string
}

/**
 * Build a renderer for the body of a documented (default) response's content
 * branch — what runs inside `if (mimeType === ...)` for each content type a
 * response declares. Use this to make an environment-specific variant by
 * supplying the expression that reads a binary body; the rest of the logic is
 * shared.
 */
export function makeApiResponseContent(options: ApiResponseContentOptions): (content: CodegenContent) => string {
	const { binaryBody } = options
	return function apiResponseContent(content: CodegenContent): string {
		switch (responseBodyHandling(content)) {
			case 'none':
				return 'return response; /* No schema */'
			case 'json':
				return 'return response.json() as any;'
			case 'binary':
				return `return ${binaryBody};`
			case 'text':
				return 'return response.text();'
			case 'unsupported':
				return 'return response; /* Unsupported mimeType */'
		}
	}
}

/**
 * The browser-flavoured default: binary bodies are read as a Blob.
 */
export const apiResponseContent = makeApiResponseContent({ binaryBody: 'response.blob()' })
