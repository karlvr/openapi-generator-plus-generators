import { CodegenContent } from '@openapi-generator-plus/types'
import { isContentJson, isBinary, isString } from '@openapi-generator-plus/template-utils'

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
		if (!content.schema) {
			return 'return response; /* No schema */'
		}
		if (isContentJson(content)) {
			return 'return response.json() as any;'
		}
		if (isBinary(content.schema)) {
			return `return ${binaryBody};`
		}
		if (isString(content.schema)) {
			return 'return response.text();'
		}
		return 'return response; /* Unsupported mimeType */'
	}
}

/**
 * The browser-flavoured default: binary bodies are read as a Blob.
 */
export const apiResponseContent = makeApiResponseContent({ binaryBody: 'response.blob()' })
