import { formPairs, multipartParts, partNamed, queryPairs, valueOf, valuesOf } from '../parse'
import { CONFORMANCE_BASE_PATH } from '../server'
import { ConformanceCase, ConformanceSuite } from '../types'
import * as path from 'path'

/** The date-time that every case sends, and the text that a client must produce for it. */
export const WHEN = '2020-01-02T03:04:05.678Z'

/** The date that every case sends. A date has no time, so a client sends the text unchanged. */
export const DAY = '2020-01-02'

/** The object that a case sends where the style names each property. */
export const OBJECT = { name: 'x', count: 1, when: WHEN }

/** A second object, so a case that sends more than one can show the order that a client keeps. */
export const OTHER_OBJECT = { name: 'y', count: 2, when: WHEN }

/** The model that the response cases send, and the value that a client must make of it. */
export const RESPONSE_OBJECT = { name: 'n', count: 2, when: WHEN, day: DAY }

/** A second model, so the array case can show the order that a client keeps. */
export const OTHER_RESPONSE_OBJECT = { name: 'm', count: 3, when: WHEN, day: DAY }

/**
 * The path segment that the path case sends.
 *
 * It holds one character from each class that RFC 3986 treats differently in a
 * path segment. A client must encode the characters that a segment cannot carry,
 * and leave the rest alone.
 */
export const PATH_SEGMENT = 'a b/c?d#e&f+g%h:i@j'

/** The text that the plain text body case sends. A quote shows a client that wrote JSON instead. */
export const TEXT_BODY = 'plain "text" body'

/**
 * The content that the binary body case sends.
 *
 * The value is text, because every client can express text bytes. A client that
 * wrote JSON or base64 still gives a different body.
 */
export const BINARY_BODY = 'binary content'

/**
 * The credentials that the security cases give a client.
 *
 * Each scheme has its own value, so a client that reads the credential of
 * another scheme shows it.
 */
export const CREDENTIALS = {
	apiKeyHeader: 'header-key',
	apiKeyQuery: 'query-key',
	bearerToken: 'bearer-token',
	basicUsername: 'basic-user',
	basicPassword: 'basic-secret',
}

/**
 * The headers that the response header case sends.
 *
 * A driver reports each one as text, under the name that this map gives, because
 * each client names a header in its own way.
 */
export const RESPONSE_HEADERS = {
	totalCount: { name: 'X-Total-Count', value: '42' },
	note: { name: 'X-Note', value: 'a note' },
}

/**
 * The header that the failure response of the error cases carries.
 *
 * A driver reports the value as text, under the name that this gives, because each client
 * names a header in its own way.
 */
export const ERROR_HEADER = { name: 'X-Error-Code', value: 'E_LIMIT' }

/** The `Authorization` credential that HTTP basic authentication builds from {@link CREDENTIALS}. */
const BASIC_CREDENTIAL = Buffer.from(`${CREDENTIALS.basicUsername}:${CREDENTIALS.basicPassword}`).toString('base64')

/**
 * The text of a percent encoded path, decoded once.
 *
 * An invalid escape gives back the text unchanged. So a client that left a "%"
 * alone fails the comparison that follows, rather than the decoder.
 */
function decodeOnce(text: string): string {
	try {
		return decodeURIComponent(text)
	} catch {
		return text
	}
}

/**
 * Every conformance case, in the order that a driver runs them.
 *
 * A driver runs each case by id, so an id must not change once a driver knows
 * it. Add a case here and in every driver.
 */
export const CASES: ConformanceCase[] = [

	/*
	 * Query parameters
	 */

	{
		id: 'query-scalars-values',
		description: 'writes one query parameter for each scalar type',
		requests: [{ method: 'GET', path: '/query/scalars' }],
		expectRequests(requests) {
			const pairs = queryPairs(requests[0])
			expect(valueOf(pairs, 'str')).toBe('hello world')
			expect(valueOf(pairs, 'num')).toBe('42')
			expect(valueOf(pairs, 'dbl')).toBe('1.5')
			/* A false value is not absent, so the client must send it */
			expect(valueOf(pairs, 'flag')).toBe('false')
			expect(valueOf(pairs, 'when')).toBe(WHEN)
			expect(valueOf(pairs, 'day')).toBe(DAY)
		},
	},
	{
		id: 'query-scalars-absent',
		description: 'omits an absent query parameter, and sends no query string',
		requests: [{ method: 'GET', path: '/query/scalars' }],
		expectRequests(requests) {
			expect(requests[0].query).toBe('')
		},
	},
	{
		id: 'query-scalars-empty-string',
		description: 'sends an empty string, which is not the same as an absent value',
		requests: [{ method: 'GET', path: '/query/scalars' }],
		expectRequests(requests) {
			const pairs = queryPairs(requests[0])
			expect(valueOf(pairs, 'str')).toBe('')
			expect(valueOf(pairs, 'num')).toBeUndefined()
		},
	},
	{
		id: 'query-arrays-form',
		description: 'writes an array in the form style, exploded and joined',
		requests: [{ method: 'GET', path: '/query/arrays' }],
		expectRequests(requests) {
			const pairs = queryPairs(requests[0])
			expect(valuesOf(pairs, 'formExplode')).toEqual(['a', 'b'])
			expect(valueOf(pairs, 'formNoExplode')).toBe('c,d')
			expect(valuesOf(pairs, 'dateTimes')).toEqual([WHEN, WHEN])
		},
	},
	{
		id: 'query-arrays-delimited',
		description: 'writes an array in the pipe and space delimited styles',
		requests: [{ method: 'GET', path: '/query/arrays' }],
		knownDefects: {
			'java-cxf': 'the client declares a plain List, so JAX-RS repeats the parameter instead of joining it',
			'java-retrofit': 'the client declares a plain List, so Retrofit repeats the parameter instead of joining it',
		},
		expectRequests(requests) {
			const pairs = queryPairs(requests[0])
			expect(valueOf(pairs, 'pipe')).toBe('a|b')
			expect(valueOf(pairs, 'space')).toBe('c d')
		},
	},
	{
		id: 'query-arrays-empty',
		description: 'writes an empty array as no value when it explodes, and as an empty value when it joins',
		requests: [{ method: 'GET', path: '/query/arrays' }],
		expectRequests(requests) {
			const pairs = queryPairs(requests[0])
			expect(valuesOf(pairs, 'formExplode')).toEqual([])
			expect(valueOf(pairs, 'formNoExplode')).toBe('')
		},
	},
	{
		id: 'query-objects-values',
		description: 'writes an object in each object style',
		requests: [{ method: 'GET', path: '/query/objects' }],
		knownDefects: {
			'java-cxf': 'the client declares the model as a query parameter, so JAX-RS writes its toString()',
			'java-retrofit': 'the client declares the model as a query parameter, so Retrofit writes its toString()',
		},
		expectRequests(requests) {
			const pairs = queryPairs(requests[0])
			/* An exploded object names each property, so it writes bare names */
			expect(valueOf(pairs, 'name')).toBe('x')
			expect(valueOf(pairs, 'count')).toBe('1')
			expect(valueOf(pairs, 'when')).toBe(WHEN)
			/* A joined object writes one value that names each property in turn */
			expect(valueOf(pairs, 'noExplode')).toBe('name,x,count,1')
			expect(valueOf(pairs, 'deep[name]')).toBe('y')
			expect(valueOf(pairs, 'deep[count]')).toBe('2')
			expect(valueOf(pairs, 'deep[when]')).toBe(WHEN)
		},
	},
	{
		id: 'joined-values-encoded-once',
		description: 'percent encodes a joined value once, whichever style joins it',
		requests: [
			{ method: 'GET', path: '/query/arrays' },
			{ method: 'GET', path: '/query/objects' },
		],
		knownDefects: {
			'java-cxf': 'the client declares the model as a query parameter, so JAX-RS writes its toString()',
			'java-retrofit': 'the client declares the model as a query parameter, so Retrofit writes its toString()',
		},
		expectRequests(requests) {
			/*
			 * One decode must give back the value. A value that still holds a percent
			 * escape after one decode went through two encoders.
			 */
			const arrays = queryPairs(requests[0])
			expect(valuesOf(arrays, 'formExplode')).toEqual(['a b'])
			expect(valueOf(arrays, 'formNoExplode')).toBe('a b')

			/* A date-time carries a colon, which shows the same fault */
			const objects = queryPairs(requests[1])
			expect(valueOf(objects, 'noExplode')).toBe(`name,a b,when,${WHEN}`)
		},
	},
	{
		id: 'query-headers-values',
		description: 'writes a header parameter, and joins a header array with a comma',
		requests: [{ method: 'GET', path: '/query/headers' }],
		knownDefects: {
			'java-cxf': 'the client declares a plain List as a header, so JAX-RS writes its toString()',
			'java-retrofit': 'the client declares a plain List as a header, so Retrofit repeats the header instead of joining it',
		},
		expectRequests(requests) {
			expect(requests[0].headers['x-text']).toEqual(['hello'])
			expect(requests[0].headers['x-numbers']).toEqual(['1,2'])
		},
	},
	{
		id: 'query-cookies-values',
		description: 'writes a cookie parameter into the Cookie header',
		requests: [{ method: 'GET', path: '/query/cookies' }],
		knownDefects: {
			'java-retrofit': 'Retrofit has no cookie parameter annotation, so the client drops the parameter',
		},
		expectRequests(requests) {
			/*
			 * RFC 6265 lets a client send one Cookie header or several, and lets it
			 * choose the space after each ";". The order of the cookies carries no
			 * meaning either. So the suite checks the pairs, sorted.
			 */
			const cookies = (requests[0].headers['cookie'] || []).join('; ')
			expect(cookies.split(/;\s*/).sort()).toEqual(['sessionId=abc', 'theme=dark'])
		},
	},
	{
		id: 'query-required-values',
		description: 'sends a required parameter, and still omits an absent optional one',
		requests: [{ method: 'GET', path: '/query/required' }],
		expectRequests(requests) {
			const pairs = queryPairs(requests[0])
			expect(valueOf(pairs, 'needed')).toBe('needed value')
			/* An absent optional parameter must not become an empty value */
			expect(valueOf(pairs, 'optional')).toBeUndefined()
			expect(requests[0].headers['x-needed']).toEqual(['needed header'])
		},
	},
	{
		id: 'query-path-segment',
		description: 'encodes only the characters that a path segment cannot carry',
		/* The declared path shows that the value stayed inside one segment */
		requests: [{ method: 'GET', path: /\/query\/path\/[^/?]+\/end/ }],
		expectRequests(requests) {
			/*
			 * A path segment may carry the sub-delims and ":" and "@" unencoded, and a client
			 * may encode them anyway. So the suite checks the value that arrives, not the
			 * exact encoding. One decode must give back the value.
			 */
			expect(decodeOnce(requests[0].path)).toBe(`${CONFORMANCE_BASE_PATH}/query/path/${PATH_SEGMENT}/end`)

			/* The value must not start a query */
			expect(requests[0].query).toBe('')
		},
	},

	/*
	 * Form request bodies
	 */

	{
		id: 'form-scalars-values',
		description: 'writes one form property for each scalar type',
		requests: [{ method: 'POST', path: '/form/scalars' }],
		expectRequests(requests) {
			expect(requests[0].headers['content-type']).toEqual(['application/x-www-form-urlencoded'])
			const pairs = formPairs(requests[0])
			expect(valueOf(pairs, 'str')).toBe('a')
			expect(valueOf(pairs, 'num')).toBe('1')
			expect(valueOf(pairs, 'flag')).toBe('false')
			expect(valueOf(pairs, 'when')).toBe(WHEN)
		},
	},
	{
		id: 'form-scalars-null',
		description: 'writes a null form property as an empty value',
		requests: [{ method: 'POST', path: '/form/scalars' }],
		expectRequests(requests) {
			const pairs = formPairs(requests[0])
			/* A form encoding carries text, so it has no null. An empty value stands for it. */
			expect(valueOf(pairs, 'nullableStr')).toBe('')
			expect(valueOf(pairs, 'nullableNum')).toBe('')
			expect(valueOf(pairs, 'nullableFlag')).toBe('')
			expect(valueOf(pairs, 'nullableWhen')).toBe('')
		},
	},
	{
		id: 'form-scalars-absent',
		description: 'omits an absent form property, so null and absent stay distinct',
		requests: [{ method: 'POST', path: '/form/scalars' }],
		expectRequests(requests) {
			expect(formPairs(requests[0])).toEqual([])
		},
	},
	{
		id: 'form-arrays-values',
		description: 'writes a form array in each collection style',
		requests: [{ method: 'POST', path: '/form/arrays' }],
		expectRequests(requests) {
			const pairs = formPairs(requests[0])
			expect(valuesOf(pairs, 'strs')).toEqual(['a', 'b'])
			expect(valueOf(pairs, 'pipeStrs')).toBe('c|d')
		},
	},
	{
		id: 'form-arrays-null',
		description: 'writes a null form array as an empty value',
		requests: [{ method: 'POST', path: '/form/arrays' }],
		expectRequests(requests) {
			const pairs = formPairs(requests[0])
			expect(valueOf(pairs, 'nullableStrs')).toBe('')
			expect(valueOf(pairs, 'nullablePipeStrs')).toBe('')
		},
	},
	{
		id: 'form-objects-values',
		description: 'writes a form object in each object style',
		requests: [{ method: 'POST', path: '/form/objects' }],
		expectRequests(requests) {
			const pairs = formPairs(requests[0])
			expect(valueOf(pairs, 'obj')).toBe('name,x,count,1')
			expect(valueOf(pairs, 'name')).toBe('x')
			expect(valueOf(pairs, 'count')).toBe('1')
			expect(valueOf(pairs, 'when')).toBe(WHEN)
			expect(valueOf(pairs, 'deepObj[name]')).toBe('y')
			expect(valueOf(pairs, 'deepObj[count]')).toBe('2')
			expect(valueOf(pairs, 'deepObj[when]')).toBe(WHEN)
		},
	},
	{
		id: 'form-objects-null',
		description: 'writes a null form object as an empty value, unless the style names each property',
		requests: [{ method: 'POST', path: '/form/objects' }],
		expectRequests(requests) {
			const pairs = formPairs(requests[0])
			/* A joined object has a place to put an empty value */
			expect(valueOf(pairs, 'nullableObj')).toBe('')
			/*
			 * An exploded object and a deepObject name each property rather than the
			 * property itself. Neither has a place for the null, so both are absent.
			 */
			expect(valuesOf(pairs, 'name')).toEqual([])
			expect(valuesOf(pairs, 'nullableExplodeObj')).toEqual([])
			expect(valuesOf(pairs, 'nullableDeepObj')).toEqual([])
			expect(valuesOf(pairs, 'nullableDeepObj[name]')).toEqual([])
		},
	},

	/*
	 * Multipart request bodies
	 */

	{
		id: 'multipart-values',
		description: 'writes one multipart part for each part type',
		requests: [{ method: 'POST', path: '/multipart/parts' }],
		expectRequests(requests) {
			/*
			 * The client must not set Content-Type itself. Only the HTTP layer knows the
			 * boundary that it wrote into the body.
			 */
			const contentType = requests[0].headers['content-type'][0]
			expect(contentType).toMatch(/^multipart\/form-data;\s*boundary=/)

			const parts = multipartParts(requests[0])
			expect(partNamed(parts, 'text')!.value).toBe('a')
			expect(JSON.parse(partNamed(parts, 'json')!.value)).toEqual(OBJECT)
			expect(partNamed(parts, 'file')!.value).toBe('file content')
		},
	},
	{
		id: 'multipart-json-content-type',
		description: 'declares the content type that the spec gives a multipart part',
		requests: [{ method: 'POST', path: '/multipart/parts' }],
		expectRequests(requests) {
			const parts = multipartParts(requests[0])
			/*
			 * The spec gives this part an encoding with a contentType. A server that
			 * reads the part by its declared type needs the header.
			 */
			expect(partNamed(parts, 'json')!.contentType).toBe('application/json')

			/*
			 * The suite does not check the filename here. Each multipart implementation
			 * declares a content type in its own way, and a browser form can only do it
			 * through a Blob, which it names `blob`.
			 */
		},
	},
	{
		id: 'multipart-null',
		description: 'writes a null part in the form that the part type can carry',
		requests: [{ method: 'POST', path: '/multipart/parts' }],
		expectRequests(requests) {
			const parts = multipartParts(requests[0])
			/* A text part carries an empty string */
			expect(partNamed(parts, 'nullableText')!.value).toBe('')
			/* A JSON part can carry a null */
			expect(partNamed(parts, 'nullableJson')!.value).toBe('null')
			/* A binary part has no null form, so the client omits it */
			expect(partNamed(parts, 'nullableFile')).toBeUndefined()
		},
	},

	/*
	 * JSON request bodies
	 */

	{
		id: 'json-null-properties',
		description: 'writes a null JSON property as a null',
		requests: [{ method: 'POST', path: '/json/body' }],
		expectRequests(requests) {
			/* A media type may carry a charset, which says nothing about the shape of the body */
			expect(requests[0].headers['content-type'][0]).toMatch(/^application\/json(;|$)/)
			const body = JSON.parse(requests[0].body)
			expect(body).toEqual({
				name: 'n',
				nullableName: null,
				nullableCount: null,
				nullableWhen: null,
				nullableChild: null,
				nullableList: null,
			})
		},
	},
	{
		id: 'json-absent-properties',
		description: 'omits an absent JSON property, so null and absent stay distinct',
		requests: [{ method: 'POST', path: '/json/body' }],
		expectRequests(requests) {
			expect(JSON.parse(requests[0].body)).toEqual({ name: 'n' })
		},
	},

	/*
	 * Request bodies that are not an object
	 */

	{
		id: 'body-array',
		description: 'sends a JSON request body that is an array',
		requests: [{ method: 'POST', path: '/body/array' }],
		expectRequests(requests) {
			expect(requests[0].headers['content-type'][0]).toMatch(/^application\/json(;|$)/)
			/* The order of an array carries meaning, so the client must keep it */
			expect(JSON.parse(requests[0].body)).toEqual([OBJECT, OTHER_OBJECT])
		},
	},
	{
		id: 'body-text',
		description: 'sends a plain text request body as text, not as JSON',
		requests: [{ method: 'POST', path: '/body/text' }],
		knownDefects: {
			'java-retrofit': 'the client has no converter for a text body, so it sends the body as application/json',
		},
		expectRequests(requests) {
			expect(requests[0].headers['content-type'][0]).toMatch(/^text\/plain(;|$)/)
			expect(requests[0].body).toBe(TEXT_BODY)
		},
	},
	{
		id: 'body-binary',
		description: 'sends a binary request body as bytes, not as JSON',
		requests: [{ method: 'POST', path: '/body/binary' }],
		knownDefects: {
			'java-retrofit': 'the client has no converter for a binary body, so it sends the body as application/json',
		},
		expectRequests(requests) {
			expect(requests[0].headers['content-type'][0]).toMatch(/^application\/octet-stream(;|$)/)
			expect(requests[0].body).toBe(BINARY_BODY)
		},
	},

	/*
	 * Responses
	 */

	{
		id: 'response-json',
		description: 'parses a JSON response into a model',
		requests: [{ method: 'GET', path: '/response/json' }],
		response: {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(RESPONSE_OBJECT),
		},
		expectRequests(requests) {
			/* The client asks for what it can parse */
			expect(requests[0].headers['accept']).toEqual(['application/json'])
		},
		expectCalls(calls) {
			expect(calls).toHaveLength(1)
			expect(calls[0].outcome).toBe('success')
			/* A date and a date-time must come back as the text that the server sent */
			expect(calls[0].value).toEqual(RESPONSE_OBJECT)
		},
	},
	{
		id: 'response-content-type-charset',
		description: 'parses a JSON response whose media type carries a charset',
		requests: [{ method: 'GET', path: '/response/json' }],
		response: {
			status: 200,
			headers: { 'Content-Type': 'application/json; charset=utf-8' },
			body: JSON.stringify(RESPONSE_OBJECT),
		},
		expectCalls(calls) {
			expect(calls).toHaveLength(1)
			expect(calls[0].outcome).toBe('success')
			expect(calls[0].value).toEqual(RESPONSE_OBJECT)
		},
	},
	{
		id: 'response-unknown-property',
		description: 'parses a JSON response that carries a property the spec does not declare',
		requests: [{ method: 'GET', path: '/response/json' }],
		response: {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ...RESPONSE_OBJECT, undeclared: 'ignored' }),
		},
		expectCalls(calls) {
			expect(calls).toHaveLength(1)
			expect(calls[0].outcome).toBe('success')
			/*
			 * A client may keep the undeclared property or drop it. Either way it must
			 * still parse the properties that the spec declares.
			 */
			expect(calls[0].value).toMatchObject(RESPONSE_OBJECT)
		},
	},
	{
		id: 'response-array',
		description: 'parses a JSON array response, and keeps its order',
		requests: [{ method: 'GET', path: '/response/array' }],
		response: {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify([RESPONSE_OBJECT, OTHER_RESPONSE_OBJECT]),
		},
		expectCalls(calls) {
			expect(calls).toHaveLength(1)
			expect(calls[0].outcome).toBe('success')
			expect(calls[0].value).toEqual([RESPONSE_OBJECT, OTHER_RESPONSE_OBJECT])
		},
	},
	{
		id: 'response-null-properties',
		description: 'tells a null response property apart from an absent one',
		requests: [{ method: 'GET', path: '/response/nullable' }],
		response: {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: 'n', nullableName: null, nullableCount: 7, nullableList: null }),
		},
		expectCalls(calls) {
			expect(calls).toHaveLength(1)
			expect(calls[0].outcome).toBe('success')
			/*
			 * A model holds a null and an absent property differently in each language,
			 * and neither survives a plain serialisation. So a driver reports one word
			 * for each property: "absent", "null", or the value as text.
			 */
			expect(calls[0].value).toEqual({
				name: 'n',
				nullableName: 'null',
				nullableCount: '7',
				nullableWhen: 'absent',
				nullableChild: 'absent',
				nullableList: 'null',
			})
		},
	},
	{
		id: 'response-headers',
		description: 'gives a caller the value of a documented response header',
		requests: [{ method: 'GET', path: '/response/headers' }],
		response: {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
				[RESPONSE_HEADERS.totalCount.name]: RESPONSE_HEADERS.totalCount.value,
				[RESPONSE_HEADERS.note.name]: RESPONSE_HEADERS.note.value,
			},
			body: JSON.stringify(RESPONSE_OBJECT),
		},
		knownDefects: {
			'fetch-client': 'the operation resolves with the model alone, so a caller cannot reach the headers',
		},
		expectCalls(calls) {
			expect(calls).toHaveLength(1)
			expect(calls[0].outcome).toBe('success')
			/*
			 * The case asks whether a caller can read the header at all. Each client
			 * names a header in its own way, so a driver reports each value as text,
			 * or "absent" where the client exposes none. It reports the name of the
			 * model too, so the case also shows that the body still arrived.
			 */
			expect(calls[0].value).toEqual({
				name: RESPONSE_OBJECT.name,
				totalCount: RESPONSE_HEADERS.totalCount.value,
				note: RESPONSE_HEADERS.note.value,
			})
		},
	},
	{
		id: 'response-empty-body',
		description: 'reports a failure when a response that declares content carries none',
		requests: [{ method: 'GET', path: '/response/json' }],
		response: { status: 200, headers: { 'Content-Type': 'application/json' }, body: '' },
		expectCalls(calls) {
			expect(calls).toHaveLength(1)
			/*
			 * The server broke its own contract, so no client can make the declared
			 * model. A client may report that as an error or as an exception. It must
			 * not report success, because it has no model to give.
			 */
			expect(calls[0].outcome).not.toBe('success')
		},
	},
	{
		id: 'response-no-content-type',
		description: 'refuses a response body that arrives with no Content-Type',
		requests: [{ method: 'GET', path: '/response/json' }],
		response: { status: 200, headers: { 'Content-Type': null }, body: JSON.stringify(RESPONSE_OBJECT) },
		knownDefects: {
			'java-retrofit': 'the client parses a body of any media type, so it does not see the absent header',
		},
		expectCalls(calls) {
			expect(calls).toHaveLength(1)
			/*
			 * The server did not say what the body holds. So the client must not guess,
			 * even though the spec declares one content type for this response. A client
			 * may report that as an error or as an exception. It must not report success.
			 */
			expect(calls[0].outcome).not.toBe('success')
		},
	},
	{
		id: 'response-none',
		description: 'reports success for a response with no content',
		requests: [{ method: 'GET', path: '/response/none' }],
		response: { status: 204 },
		expectCalls(calls) {
			expect(calls).toHaveLength(1)
			expect(calls[0].outcome).toBe('success')
		},
	},
	{
		id: 'response-error',
		description: 'reports an error for a documented failure response',
		requests: [{ method: 'GET', path: '/response/error' }],
		response: {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ message: 'bad' }),
		},
		expectCalls(calls) {
			expect(calls).toHaveLength(1)
			expect(calls[0].outcome).toBe('error')
			expect(calls[0].httpStatus).toBe(400)
		},
	},
	{
		id: 'response-error-body',
		description: 'parses the body of a documented failure response into its model',
		requests: [{ method: 'GET', path: '/response/error' }],
		response: {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ message: 'bad' }),
		},
		knownDefects: {
			'fetch-client': 'the client throws the raw response for a failure, so the caller parses the body itself',
			'java-retrofit': 'the operation returns one body type, so the client leaves a failure body unparsed',
		},
		expectCalls(calls) {
			expect(calls).toHaveLength(1)
			expect(calls[0].outcome).toBe('error')
			expect(calls[0].value).toEqual({ message: 'bad' })
		},
	},
	{
		id: 'response-error-headers',
		description: 'gives a caller the value of a header that a failure response declares',
		requests: [{ method: 'GET', path: '/response/error' }],
		response: {
			status: 400,
			headers: { 'Content-Type': 'application/json', [ERROR_HEADER.name]: ERROR_HEADER.value },
			body: JSON.stringify({ message: 'bad' }),
		},
		expectCalls(calls) {
			expect(calls).toHaveLength(1)
			/*
			 * The case asks whether a caller can read the header of a failure at all. So each
			 * driver catches the failure itself and reports the value as text, or "absent"
			 * where the client exposes none. A client that reported no failure says so too.
			 */
			expect(calls[0].outcome).toBe('success')
			expect(calls[0].value).toEqual({ errorCode: ERROR_HEADER.value })
		},
	},
	{
		id: 'response-undocumented-status',
		description: 'reports an error for a status that the spec does not declare',
		requests: [{ method: 'GET', path: '/response/json' }],
		response: {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ message: 'boom' }),
		},
		expectCalls(calls) {
			expect(calls).toHaveLength(1)
			expect(calls[0].outcome).toBe('error')
			expect(calls[0].httpStatus).toBe(500)
		},
	},

	/*
	 * Security
	 */

	{
		id: 'security-api-key-header',
		description: 'sends an API key in the header that the scheme names',
		requests: [{ method: 'GET', path: '/security/api-key-header' }],
		knownDefects: {
			'java-retrofit': 'the client gives a caller no way to supply a credential, so it sends none',
		},
		expectRequests(requests) {
			expect(requests[0].headers['x-api-key']).toEqual([CREDENTIALS.apiKeyHeader])
		},
	},
	{
		id: 'security-api-key-query',
		description: 'sends an API key in the query parameter that the scheme names',
		requests: [{ method: 'GET', path: '/security/api-key-query' }],
		knownDefects: {
			'java-retrofit': 'the client gives a caller no way to supply a credential, so it sends none',
		},
		expectRequests(requests) {
			expect(valueOf(queryPairs(requests[0]), 'api_key')).toBe(CREDENTIALS.apiKeyQuery)
		},
	},
	{
		id: 'security-bearer',
		description: 'sends a bearer token in the Authorization header',
		requests: [{ method: 'GET', path: '/security/bearer' }],
		knownDefects: {
			'java-retrofit': 'the client gives a caller no way to supply a credential, so it sends none',
		},
		expectRequests(requests) {
			expect(requests[0].headers['authorization']).toEqual([`Bearer ${CREDENTIALS.bearerToken}`])
		},
	},
	{
		id: 'security-basic',
		description: 'sends a basic credential in the Authorization header',
		requests: [{ method: 'GET', path: '/security/basic' }],
		knownDefects: {
			'java-retrofit': 'the client gives a caller no way to supply a credential, so it sends none',
		},
		expectRequests(requests) {
			/* RFC 7617 joins the user and the password with a ":", then encodes the pair as base64 */
			expect(requests[0].headers['authorization']).toEqual([`Basic ${BASIC_CREDENTIAL}`])
		},
	},
]

/**
 * The general conformance suite: parameters, bodies, responses and security.
 *
 * A case that needs a schema of its own belongs in a suite of its own, so that
 * this spec stays a list of plain operations.
 */
export const CONFORMANCE: ConformanceSuite = {
	id: 'conformance',
	spec: path.join(__dirname, '..', '..', 'specs', 'conformance.yml'),
	cases: CASES,
}
