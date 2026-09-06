import { formPairs, multipartParts, partNamed, queryPairs, valueOf, valuesOf } from './parse'
import { ConformanceCase } from './types'

/** The date-time that every case sends, and the text that a client must produce for it. */
export const WHEN = '2020-01-02T03:04:05.678Z'

/** The date that every case sends. A date has no time, so a client sends the text unchanged. */
export const DAY = '2020-01-02'

/** The object that the object cases send. */
export const OBJECT = { name: 'x', count: 1, when: WHEN }

/**
 * The path segment that the path case sends.
 *
 * It holds one character from each class that RFC 3986 treats differently in a
 * path segment. A client must encode the characters that a segment cannot carry,
 * and leave the rest alone.
 */
export const PATH_SEGMENT = 'a b/c?d#e&f+g%h:i@j'

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
		expectRequests(requests) {
			expect(requests).toHaveLength(1)
			const pairs = queryPairs(requests[0])
			expect(requests[0].path).toBe('/query/scalars')
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
		expectRequests(requests) {
			expect(requests).toHaveLength(1)
			expect(requests[0].query).toBe('')
		},
	},
	{
		id: 'query-scalars-empty-string',
		description: 'sends an empty string, which is not the same as an absent value',
		expectRequests(requests) {
			expect(requests).toHaveLength(1)
			const pairs = queryPairs(requests[0])
			expect(valueOf(pairs, 'str')).toBe('')
			expect(valueOf(pairs, 'num')).toBeUndefined()
		},
	},
	{
		id: 'query-arrays-form',
		description: 'writes an array in the form style, exploded and joined',
		expectRequests(requests) {
			expect(requests).toHaveLength(1)
			const pairs = queryPairs(requests[0])
			expect(valuesOf(pairs, 'formExplode')).toEqual(['a', 'b'])
			expect(valueOf(pairs, 'formNoExplode')).toBe('a,b')
			expect(valuesOf(pairs, 'dateTimes')).toEqual([WHEN, WHEN])
		},
	},
	{
		id: 'query-arrays-delimited',
		description: 'writes an array in the pipe and space delimited styles',
		knownDefects: {
			'java-cxf': 'the client declares a plain List, so JAX-RS repeats the parameter instead of joining it',
		},
		expectRequests(requests) {
			expect(requests).toHaveLength(1)
			const pairs = queryPairs(requests[0])
			expect(valueOf(pairs, 'pipe')).toBe('a|b')
			expect(valueOf(pairs, 'space')).toBe('a b')
		},
	},
	{
		id: 'query-arrays-empty',
		description: 'writes an empty array as no value when it explodes, and as an empty value when it joins',
		expectRequests(requests) {
			expect(requests).toHaveLength(1)
			const pairs = queryPairs(requests[0])
			expect(valuesOf(pairs, 'formExplode')).toEqual([])
			expect(valueOf(pairs, 'formNoExplode')).toBe('')
		},
	},
	{
		id: 'query-objects-values',
		description: 'writes an object in each object style',
		knownDefects: {
			'java-cxf': 'the client declares the model as a query parameter, so JAX-RS writes its toString()',
		},
		expectRequests(requests) {
			expect(requests).toHaveLength(1)
			const pairs = queryPairs(requests[0])
			/* An exploded object names each property, so it writes bare names */
			expect(valueOf(pairs, 'name')).toBe('x')
			expect(valueOf(pairs, 'count')).toBe('1')
			expect(valueOf(pairs, 'when')).toBe(WHEN)
			/* A joined object writes one value that names each property in turn */
			expect(valueOf(pairs, 'noExplode')).toBe('name,x,count,1')
			expect(valueOf(pairs, 'deep[name]')).toBe('x')
			expect(valueOf(pairs, 'deep[count]')).toBe('1')
			expect(valueOf(pairs, 'deep[when]')).toBe(WHEN)
		},
	},
	{
		id: 'joined-values-encoded-once',
		description: 'percent encodes a joined value once, whichever style joins it',
		knownDefects: {
			'java-cxf': 'the client declares the model as a query parameter, so JAX-RS writes its toString()',
		},
		expectRequests(requests) {
			expect(requests).toHaveLength(2)

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
		knownDefects: {
			'java-cxf': 'the client declares a plain List as a header, so JAX-RS writes its toString()',
		},
		expectRequests(requests) {
			expect(requests).toHaveLength(1)
			expect(requests[0].headers['x-text']).toEqual(['hello'])
			expect(requests[0].headers['x-numbers']).toEqual(['1,2'])
		},
	},
	{
		id: 'query-path-segment',
		description: 'encodes only the characters that a path segment cannot carry',
		knownDefects: {
			'java-cxf': 'the client does not encode a \'/\' in a path parameter, so the value adds a path segment',
		},
		expectRequests(requests) {
			expect(requests).toHaveLength(1)
			/*
			 * A path segment may carry the sub-delims and ":" and "@" unencoded. It may not
			 * carry "/", "?", "#", "%" or a space.
			 */
			expect(requests[0].path).toBe('/query/path/a%20b%2Fc%3Fd%23e&f+g%25h:i@j/end')
			expect(decodeURIComponent(requests[0].path)).toBe(`/query/path/${PATH_SEGMENT}/end`)
		},
	},

	/*
	 * Form request bodies
	 */

	{
		id: 'form-scalars-values',
		description: 'writes one form property for each scalar type',
		skipDrivers: {
			'java-cxf': 'the client takes a JAX-RS Form, so the caller encodes the body, not the client',
		},
		expectRequests(requests) {
			expect(requests).toHaveLength(1)
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
		skipDrivers: {
			'java-cxf': 'the client takes a JAX-RS Form, so the caller encodes the body, not the client',
		},
		expectRequests(requests) {
			expect(requests).toHaveLength(1)
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
		skipDrivers: {
			'java-cxf': 'the client takes a JAX-RS Form, so the caller encodes the body, not the client',
		},
		expectRequests(requests) {
			expect(requests).toHaveLength(1)
			expect(formPairs(requests[0])).toEqual([])
		},
	},
	{
		id: 'form-arrays-values',
		description: 'writes a form array in each collection style',
		skipDrivers: {
			'java-cxf': 'the client takes a JAX-RS Form, so the caller encodes the body, not the client',
		},
		expectRequests(requests) {
			expect(requests).toHaveLength(1)
			const pairs = formPairs(requests[0])
			expect(valuesOf(pairs, 'strs')).toEqual(['a', 'b'])
			expect(valueOf(pairs, 'pipeStrs')).toBe('a|b')
		},
	},
	{
		id: 'form-arrays-null',
		description: 'writes a null form array as an empty value',
		skipDrivers: {
			'java-cxf': 'the client takes a JAX-RS Form, so the caller encodes the body, not the client',
		},
		expectRequests(requests) {
			expect(requests).toHaveLength(1)
			const pairs = formPairs(requests[0])
			expect(valueOf(pairs, 'nullableStrs')).toBe('')
			expect(valueOf(pairs, 'nullablePipeStrs')).toBe('')
		},
	},
	{
		id: 'form-objects-values',
		description: 'writes a form object in each object style',
		skipDrivers: {
			'java-cxf': 'the client takes a JAX-RS Form, so the caller encodes the body, not the client',
		},
		expectRequests(requests) {
			expect(requests).toHaveLength(1)
			const pairs = formPairs(requests[0])
			expect(valueOf(pairs, 'obj')).toBe('name,x,count,1')
			expect(valueOf(pairs, 'name')).toBe('x')
			expect(valueOf(pairs, 'count')).toBe('1')
			expect(valueOf(pairs, 'when')).toBe(WHEN)
			expect(valueOf(pairs, 'deepObj[name]')).toBe('x')
			expect(valueOf(pairs, 'deepObj[count]')).toBe('1')
			expect(valueOf(pairs, 'deepObj[when]')).toBe(WHEN)
		},
	},
	{
		id: 'form-objects-null',
		description: 'writes a null form object as an empty value, unless the style names each property',
		skipDrivers: {
			'java-cxf': 'the client takes a JAX-RS Form, so the caller encodes the body, not the client',
		},
		expectRequests(requests) {
			expect(requests).toHaveLength(1)
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
		knownDefects: {
			'java-cxf': 'the client names every part \'null\', because it sets the name on the disposition and not on the attachment',
		},
		expectRequests(requests) {
			expect(requests).toHaveLength(1)
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
		knownDefects: {
			'java-cxf': 'the client names every part \'null\', because it sets the name on the disposition and not on the attachment',
		},
		expectRequests(requests) {
			expect(requests).toHaveLength(1)
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
		knownDefects: {
			'java-cxf': 'the client passes a null attachment object, which CXF cannot write',
		},
		expectRequests(requests) {
			expect(requests).toHaveLength(1)
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
		expectRequests(requests) {
			expect(requests).toHaveLength(1)
			expect(requests[0].headers['content-type']).toEqual(['application/json'])
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
		expectRequests(requests) {
			expect(requests).toHaveLength(1)
			expect(JSON.parse(requests[0].body)).toEqual({ name: 'n' })
		},
	},

	/*
	 * Responses
	 */

	{
		id: 'response-json',
		description: 'parses a JSON response into a model',
		response: {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: 'n', count: 2, when: WHEN }),
		},
		expectRequests(requests) {
			expect(requests).toHaveLength(1)
			/* The client asks for what it can parse */
			expect(requests[0].headers['accept']).toEqual(['application/json'])
		},
		expectCalls(calls) {
			expect(calls).toHaveLength(1)
			expect(calls[0].outcome).toBe('success')
			expect(calls[0].value).toEqual({ name: 'n', count: 2, when: WHEN })
		},
	},
	{
		id: 'response-none',
		description: 'reports success for a response with no content',
		response: { status: 204 },
		expectCalls(calls) {
			expect(calls).toHaveLength(1)
			expect(calls[0].outcome).toBe('success')
		},
	},
	{
		id: 'response-error',
		description: 'reports an error for a documented failure response',
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
]
