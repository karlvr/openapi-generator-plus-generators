import { CodegenContent, CodegenOperation } from '@openapi-generator-plus/types'

/**
 * Reports whether a generated client can parse a response body with this content.
 *
 * Each generator supplies its own predicate, next to the response handling that must agree
 * with it. A client that returns the raw response for a content type does not parse it.
 */
export type CanParseContent = (content: CodegenContent) => boolean

/**
 * The media types to send in the `Accept` header for an operation.
 *
 * The result holds the mime types of the operation's default response, in spec order and
 * without duplicates, keeping only the content that `canParse` accepts. The result is empty
 * when the operation has no default response, or when the client can parse none of its content.
 *
 * The `Accept` header applies to the whole request, not to one status code. So the result
 * never includes a media type that only an error response declares. Otherwise a server could
 * answer a successful request with a media type that the client handles only as an error.
 */
export function acceptMediaTypes(operation: CodegenOperation, canParse: CanParseContent): string[] {
	const result: string[] = []

	const contents = operation.defaultResponse?.contents
	if (!contents) {
		return result
	}

	for (const content of contents) {
		const mimeType = content.mediaType.mimeType
		if (canParse(content) && !result.includes(mimeType)) {
			result.push(mimeType)
		}
	}
	return result
}
