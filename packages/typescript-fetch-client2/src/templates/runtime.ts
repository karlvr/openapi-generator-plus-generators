import { ts, SKIP } from '@openapi-generator-plus/template-utils'
import { header } from './header'
import { DocumentContext, FetchClient2Hooks, RootContext } from './types'

/**
 * Default body for the `runtimeImports` hook: the polyfill import line, used
 * when `includePolyfills` is set in the generator options. Child generators
 * that override `runtimeImports` typically don't want polyfills and just
 * supply their own import block instead.
 */
function defaultRuntimeImports(ctx: RootContext): string {
	return ctx.includePolyfills ? 'import "whatwg-fetch";' : ''
}

/**
 * Default body for the `defaultFetch` hook: the browser-fetch fallback.
 */
function defaultDefaultFetch(): string {
	return `const MISSING_FETCH: FetchAPI = () => { throw new Error('fetch is undefined'); };
export const defaultFetch: FetchAPI = typeof window !== "undefined" && typeof window.fetch !== "undefined"
	? window.fetch.bind(window) as typeof window.fetch
	: typeof fetch !== "undefined"
		? fetch
		: MISSING_FETCH
		;`
}

export function runtime(ctx: DocumentContext, hooks: FetchClient2Hooks): string {
	const baseUriLine = (ctx.servers && ctx.servers.length > 0)
		? `export const BASE_URI = "${ctx.servers[0].url}".replace(/\\/+$/, "");`
		: 'export const BASE_URI = "";'

	const runtimeImports = (hooks.runtimeImports ?? defaultRuntimeImports)(ctx as RootContext)
	const defaultFetchImpl = (hooks.defaultFetch ?? defaultDefaultFetch)(ctx as RootContext)

	return ts`${header(ctx)}

${runtimeImports || SKIP}
${defaultFetchImpl}
${baseUriLine}

/**
 *
 * @export
 */
export const COLLECTION_FORMATS = {
	csv: ",",
	ssv: " ",
	tsv: "\\t",
	pipes: "|",
};

/**
 *
 * @export
 * @type FetchAPI
 */
export type FetchAPI = (url: string, init?: RequestInit) => Promise<Response>;

/**
 *
 * @export
 * @interface FetchArgs
 */
export interface FetchArgs {
	url: string;
	options: RequestInit;
}

/**
 * An unauthorized response from the API. This could be due to missing or invalid authorization credentials.
 */
export interface UnauthorizedResponse {
	status: 'unauthorized'
	response: Response
}

/**
 * An undocumented response from the API. This could be due to an unexpected status code or content
 * type.
 */
export interface UndocumentedResponse {
	status: 'undocumented'
	response: Response
	contentType?: string | undefined
}

/**
 * An error that occured while trying to call the API, such as due to network errors.
 */
export interface FetchErrorResponse {
	status: 'error'
	error: unknown
}

export type UnexpectedResponse = UndocumentedResponse | FetchErrorResponse

export function isUnauthorizedResponse<T>(response: T | UnauthorizedResponse): response is UnauthorizedResponse {
	return response && typeof response === 'object' && 'status' in response && response.status === 'unauthorized'
}

export function isUndocumentedResponse<T>(response: T | UndocumentedResponse): response is UndocumentedResponse {
	return response && typeof response === 'object' && 'status' in response && response.status === 'undocumented'
}

export function isFetchErrorResponse<T>(response: T | FetchErrorResponse): response is FetchErrorResponse {
	return response && typeof response === 'object' && 'status' in response && response.status === 'error'
}

export function isUnexpectedResponse<T>(response: T | UnexpectedResponse): response is UnexpectedResponse {
	return isUndocumentedResponse(response) || isFetchErrorResponse(response)
}

export function isDocumentedResponse<T>(response: T | UnexpectedResponse | UnauthorizedResponse): response is T {
	return !isUnexpectedResponse(response) && !isUnauthorizedResponse(response)
}

/**
 *
 * @export
 * @class RequiredError
 * @extends {Error}
 */
export class RequiredError extends Error {
	constructor(public field: string, msg?: string) {
		super(msg);
		Object.setPrototypeOf(this, RequiredError.prototype);
		this.name = "RequiredError";
	}
}

/* The following characters are legal in URL path segments, but are encoded by \`encodeURIComponent\`

	From RFC 3986: https://datatracker.ietf.org/doc/html/rfc3986
	segment       = *pchar
	pchar         = unreserved / pct-encoded / sub-delims / ":" / "@"
	pct-encoded   = "%" HEXDIG HEXDIG
	unreserved    = ALPHA / DIGIT / "-" / "." / "_" / "~"
	sub-delims    = "!" / "$" / "&" / "'" / "(" / ")" / "*" / "+" / "," / ";" / "="

*/
const URL_PATH_SEGMENT_CHARS = [
/* -- sub-delims -- */
/*	'!',  - Not needed, as this is not encoded by \`encodeURIComponent\` */
	'$',
	'&',
/*	'\\'', - Not needed, as this is not encoded by \`encodeURIComponent\` */
/*	'(',  - Not needed, as this is not encoded by \`encodeURIComponent\` */
/*	')',  - Not needed, as this is not encoded by \`encodeURIComponent\` */
/*	'*',  - Not needed, as this is not encoded by \`encodeURIComponent\` */
	'+',
	',',
	';',
	'=',
/* -- specific pchars -- */
	':',
	'@',
]
const URL_PATH_SEGMENT_CHAR_MAP = URL_PATH_SEGMENT_CHARS.reduce((acc: Record<string, string>, char) => {
	acc[encodeURIComponent(char)] = char
	return acc
}, {})

/**
 * Similar to \`encodeURIComponent\`, but does not encode certain characters that are specifically legal
 * in URL path segments, according to RFC 3986: https://datatracker.ietf.org/doc/html/rfc3986
 *
 * See {@link URL_PATH_SEGMENT_CHARS} for the list of characters that are not encoded.
 *
 * @export
 */
export function encodeURIPathSegment(segment: string) {
	let result = encodeURIComponent(segment)
	Object.entries(URL_PATH_SEGMENT_CHAR_MAP).forEach(([encoded, char]) => {
		/* This is an alternative to using String.replaceAll, which isn't available in older environments */
		result = result.split(encoded).join(char)
	})
	return result
}

/**
 * We sometimes represent dates as strings (in models) and as Dates (in parameters) so this
 * function converts them both to a string.
 */
export function dateToString(value: Date | string): string

/**
 * We sometimes represent dates as strings (in models) and as Dates (in parameters) so this
 * function converts them both to a string.
 */
export function dateToString(value: Date | string | undefined): string | undefined {
	if (value instanceof Date) {
		return value.toISOString();
	} else if (typeof value === 'string') {
		return value;
	} else {
		return undefined;
	}
}
`
}
