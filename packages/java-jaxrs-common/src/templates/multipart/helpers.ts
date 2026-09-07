import { CodegenContentPropertyEncoding } from '@openapi-generator-plus/types'

/**
 * Report whether a multipart part can carry a null value.
 *
 * A JSON part encodes null directly. A text part encodes it as an empty string. A binary
 * part has no null form, so a caller must omit it.
 */
export function multipartPartCanBeNull(entry: CodegenContentPropertyEncoding): boolean {
	return entry.contentType !== 'application/octet-stream'
}

/**
 * The message that a generator reports when an API declares a multipart request body that
 * the generator cannot render.
 *
 * JAX-RS 2.1 has no multipart API. Each implementation invented its own, so a client or a
 * server that names no implementation cannot express a multipart body at all. Jakarta REST
 * 3.1 added `EntityPart`, which every implementation of that version supplies.
 */
export const NO_MULTIPART_MESSAGE =
	'JAX-RS 2.1 declares no multipart API, so this generator cannot render a multipart request body. '
	+ 'Set the useJakarta option to use the Jakarta REST 3.1 EntityPart API, or use a generator that '
	+ 'targets one JAX-RS implementation, such as the CXF generators.'
