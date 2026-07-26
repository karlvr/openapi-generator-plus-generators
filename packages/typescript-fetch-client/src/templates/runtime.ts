import { ts, when } from '@openapi-generator-plus/template-utils'
import { header } from './header'
import { DocumentContext, FetchClientHooks, RootContext } from './types'

/**
 * Default body for the `runtimeImports` hook: the polyfill import (if
 * `includePolyfills` is set) followed by the browser-fetch fallback that
 * defines `defaultFetch`. Child generators that override `runtimeImports`
 * typically replace this whole block with their own fetch implementation.
 */
function defaultRuntimeImports(ctx: RootContext): string {
	return ts`
${when(ctx.includePolyfills, 'import "whatwg-fetch";')}
const MISSING_FETCH: FetchAPI = () => { throw new Error('fetch is undefined'); };
export const defaultFetch: FetchAPI = typeof window !== "undefined" && typeof window.fetch !== "undefined"
	? window.fetch.bind(window) as typeof window.fetch
	: typeof fetch !== "undefined"
		? fetch
		: MISSING_FETCH
		;`
}

export function runtime(ctx: DocumentContext, hooks: FetchClientHooks): string {
	return ts`
${header(ctx)}

${(hooks.runtimeImports ?? defaultRuntimeImports)(ctx)}
import { Configuration } from "./configuration";

${(ctx.servers && ctx.servers.length > 0)
		? `export const BASE_PATH = "${ctx.servers[0].url}".replace(/\\/+$/, "");`
		: 'export const BASE_PATH = "";'}

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
 *
 * @export
 * @class BaseAPI
 */
export class BaseAPI {
	protected configuration?: Configuration;

	constructor(configuration?: Configuration, protected basePath: string = BASE_PATH, protected fetch: FetchAPI = defaultFetch) {
		if (configuration) {
			this.configuration = configuration;
			this.basePath = configuration.basePath || this.basePath;
		}
	}
};

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
`
}
