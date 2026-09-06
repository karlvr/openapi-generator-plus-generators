import { RecordedRequest } from './server'

/** One name and value pair from a query string or a form body. */
export type Pair = [string, string]

/** One part of a multipart request body. */
export interface MultipartPart {
	/** The `name` of the part, from its `Content-Disposition` header. */
	name: string
	/** The `filename` of the part, from its `Content-Disposition` header, if it has one. */
	filename?: string
	/** The `Content-Type` of the part, if it has one. */
	contentType?: string
	/** The content of the part, decoded as UTF-8, without the trailing line break. */
	value: string
}

/**
 * The name and value pairs of a query string, in the order that they appear.
 *
 * The result holds decoded text, so a pipe delimited value reads as `a|b`. Read
 * `request.query` instead to assert on the encoding itself.
 */
export function queryPairs(request: RecordedRequest): Pair[] {
	return pairsOf(request.query)
}

/**
 * The name and value pairs of a form encoded request body, in the order that
 * they appear.
 *
 * Use this for a body of type `application/x-www-form-urlencoded`.
 */
export function formPairs(request: RecordedRequest): Pair[] {
	return pairsOf(request.body)
}

/**
 * The values of one name, in the order that they appear.
 *
 * An absent name gives an empty array. A name that carries an empty value gives
 * an array with one empty string, so a caller can tell null from absent.
 */
export function valuesOf(pairs: Pair[], name: string): string[] {
	const result: string[] = []
	for (const pair of pairs) {
		if (pair[0] === name) {
			result.push(pair[1])
		}
	}
	return result
}

/**
 * The single value of one name, or `undefined` if the name is absent.
 *
 * @throws if the name appears more than once
 */
export function valueOf(pairs: Pair[], name: string): string | undefined {
	const values = valuesOf(pairs, name)
	if (values.length > 1) {
		throw new Error(`Expected at most one "${name}", but found ${values.length}: ${values.join(', ')}`)
	}
	return values[0]
}

/**
 * The parts of a multipart request body, in the order that they appear.
 *
 * @throws if the request does not declare a multipart body with a boundary
 */
export function multipartParts(request: RecordedRequest): MultipartPart[] {
	const contentType = (request.headers['content-type'] || [])[0]
	if (!contentType) {
		throw new Error('The request declares no Content-Type, so it has no multipart boundary')
	}

	const match = /boundary=(?:"([^"]+)"|([^;]+))/.exec(contentType)
	if (!match) {
		throw new Error(`The Content-Type declares no boundary: ${contentType}`)
	}

	const boundary = `--${match[1] || match[2]}`
	const result: MultipartPart[] = []

	for (const section of request.body.split(boundary)) {
		if (section === '' || section === '--' || section === '--\r\n' || section === '\r\n') {
			continue
		}

		const separator = section.indexOf('\r\n\r\n')
		if (separator === -1) {
			continue
		}

		const headerText = section.substring(0, separator).trim()
		let value = section.substring(separator + 4)
		if (value.endsWith('\r\n')) {
			value = value.substring(0, value.length - 2)
		}

		const headers: Record<string, string> = {}
		for (const line of headerText.split('\r\n')) {
			const colon = line.indexOf(':')
			if (colon !== -1) {
				headers[line.substring(0, colon).trim().toLowerCase()] = line.substring(colon + 1).trim()
			}
		}

		const disposition = headers['content-disposition'] || ''
		const name = /name="([^"]*)"/.exec(disposition)
		const filename = /filename="([^"]*)"/.exec(disposition)

		result.push({
			name: name ? name[1] : '',
			filename: filename ? filename[1] : undefined,
			contentType: headers['content-type'],
			value,
		})
	}

	return result
}

/** The single part with `name`, or `undefined` if no part has that name. */
export function partNamed(parts: MultipartPart[], name: string): MultipartPart | undefined {
	const found = parts.filter(part => part.name === name)
	if (found.length > 1) {
		throw new Error(`Expected at most one part named "${name}", but found ${found.length}`)
	}
	return found[0]
}

function pairsOf(text: string): Pair[] {
	if (!text) {
		return []
	}

	const result: Pair[] = []
	for (const segment of text.split('&')) {
		if (segment === '') {
			continue
		}
		const equals = segment.indexOf('=')
		if (equals === -1) {
			result.push([decode(segment), ''])
		} else {
			result.push([decode(segment.substring(0, equals)), decode(segment.substring(equals + 1))])
		}
	}
	return result
}

function decode(text: string): string {
	return decodeURIComponent(text.replace(/\+/g, ' '))
}
