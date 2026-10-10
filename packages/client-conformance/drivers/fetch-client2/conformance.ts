/*
 * The conformance driver for the typescript-fetch-client2 generator, and for the
 * generators that build on it.
 *
 * The suite copies this file into the generated project, so the project's own
 * compiler checks it against the generated types. A signature change that a
 * caller cannot write then fails the build.
 *
 * The driver only makes calls. It reports what each call produced, and the suite
 * asserts on that, and on what a recording server received.
 *
 * Run it as: node dist/conformance.js <baseUrl> <resultsPath>
 */

import { Api, BodyApi, Configuration, FormApi, JsonApi, MultipartApi, QueryApi, ResponseApi, RootApi, SecurityApi, setDefaultConfiguration } from './index'
import { baseUrl, call, drive, startCase } from './harness'

const WHEN = '2020-01-02T03:04:05.678Z'
const DAY = '2020-01-02'
const PATH_SEGMENT = 'a b/c?d#e&f+g%h:i@j'
const TEXT_BODY = 'plain "text" body'
const BINARY_BODY = 'binary content'
const API_KEY_HEADER = 'header-key'
const API_KEY_QUERY = 'query-key'
const BEARER_TOKEN = 'bearer-token'
const BASIC_USERNAME = 'basic-user'
const BASIC_PASSWORD = 'basic-secret'

function anObject(): Api.QueryObject {
	return { name: 'x', count: 1, when: WHEN }
}

/**
 * A second object, so a case that sends more than one object can tell them apart.
 * The driver passes its arguments by position, so two equal objects would hide a
 * call that passes them in the wrong order.
 */
function anotherObject(): Api.QueryObject {
	return { name: 'y', count: 2, when: WHEN }
}

/** A joined style writes every property into one value, so it needs values that no style has to encode. */
function aPlainObject(): Api.QueryObject {
	return { name: 'x', count: 1 }
}

/**
 * How the driver reports one property of a response model: "absent" when the
 * model carries no value, "null" when it carries a null, and the value as text
 * otherwise.
 *
 * A model holds a null and an absent property differently in each language, and
 * neither survives a plain serialisation. So the driver names the state itself.
 */
function state(model: object, name: string): string {
	const value = (model as unknown as Record<string, unknown>)[name]
	if (value === undefined) {
		return 'absent'
	}
	return value === null ? 'null' : String(value)
}

/** The state of every property of a nullable response model. */
function statesOf(model: Api.JsonBody): Record<string, string> {
	return {
		name: state(model, 'name'),
		nullableName: state(model, 'nullableName'),
		nullableCount: state(model, 'nullableCount'),
		nullableWhen: state(model, 'nullableWhen'),
		nullableChild: state(model, 'nullableChild'),
		nullableList: state(model, 'nullableList'),
	}
}

/**
 * How the driver reports the documented headers of a response: each value as
 * text, or "absent" where the client exposes none.
 *
 * The report carries the name of the model too, so a case can also see that the
 * body still arrived.
 */
function headerStates(name: string, totalCount: number | undefined, note: string | undefined): Record<string, string> {
	return {
		name,
		totalCount: totalCount !== undefined ? String(totalCount) : 'absent',
		note: note !== undefined ? note : 'absent',
	}
}


/**
 * How a driver reports the typed headers of a response: each value as text, a list as the
 * text of each element, or "absent" where the client exposes none.
 */
function headerTypeStates(name: string, ids: unknown[] | undefined, count: unknown): Record<string, unknown> {
	return {
		name,
		ids: ids !== undefined ? ids.map(id => String(id)) : 'absent',
		count: count !== undefined ? String(count) : 'absent',
	}
}

/**
 * How a driver reports the header of a documented failure response: the value as text, or
 * "absent" where the client exposes none.
 */
function errorHeaderStates(errorCode: string | undefined): Record<string, string> {
	return { errorCode: errorCode !== undefined ? errorCode : 'absent' }
}

async function main(): Promise<void> {
	/*
	 * The client asks for the credential of one scheme at a time, and names the
	 * scheme. Each scheme has its own value, so a client that reads the credential
	 * of another scheme shows it.
	 */
	setDefaultConfiguration(new Configuration({
		baseUri: baseUrl,
		apiKey: (name: string) => name === 'apiKeyHeader' ? API_KEY_HEADER : API_KEY_QUERY,
		authorization: (name: string) => name === 'bearerAuth' ? BEARER_TOKEN : null,
		username: BASIC_USERNAME,
		password: BASIC_PASSWORD,
	}))

	await startCase('query-scalars-values')
	await call(() => QueryApi.queryScalars({ str: 'hello world', num: 42, dbl: 1.5, flag: false, when: new Date(WHEN), day: DAY }))

	await startCase('query-scalars-absent')
	await call(() => QueryApi.queryScalars({}))

	await startCase('query-scalars-empty-string')
	await call(() => QueryApi.queryScalars({ str: '' }))

	await startCase('query-arrays-form')
	await call(() => QueryApi.queryArrays({
		formExplode: ['a', 'b'],
		formNoExplode: ['c', 'd'],
		dateTimes: [new Date(WHEN), new Date(WHEN)],
	}))

	await startCase('query-arrays-delimited')
	await call(() => QueryApi.queryArrays({ pipe: ['a', 'b'], space: ['c', 'd'] }))

	await startCase('query-arrays-empty')
	await call(() => QueryApi.queryArrays({ formExplode: [], formNoExplode: [], dateTimes: [] }))

	await startCase('query-objects-values')
	await call(() => QueryApi.queryObjects({ explode: anObject(), noExplode: aPlainObject(), deep: anotherObject() }))

	await startCase('joined-values-encoded-once')
	await call(() => QueryApi.queryArrays({ formExplode: ['a b'], formNoExplode: ['a b'] }))
	await call(() => QueryApi.queryObjects({ noExplode: { name: 'a b', when: WHEN } }))

	await startCase('query-headers-values')
	await call(() => QueryApi.queryHeaders({ xText: 'hello', xNumbers: [1, 2] }))

	await startCase('query-cookies-values')
	await call(() => QueryApi.queryCookies({ sessionId: 'abc', theme: 'dark' }))

	await startCase('query-required-values')
	await call(() => QueryApi.queryRequired({ needed: 'needed value', xNeeded: 'needed header' }))

	await startCase('query-path-segment')
	await call(() => QueryApi.queryPathSegment(PATH_SEGMENT))

	await startCase('path-root')
	await call(() => RootApi.root())

	await startCase('form-scalars-values')
	await call(() => FormApi.formScalars({ str: 'a', num: 1, flag: false, when: WHEN }))

	await startCase('form-scalars-null')
	await call(() => FormApi.formScalars({ nullableStr: null, nullableNum: null, nullableFlag: null, nullableWhen: null }))

	await startCase('form-scalars-absent')
	await call(() => FormApi.formScalars({}))

	await startCase('form-arrays-values')
	await call(() => FormApi.formArrays({ strs: ['a', 'b'], pipeStrs: ['c', 'd'] }))

	await startCase('form-arrays-null')
	await call(() => FormApi.formArrays({ nullableStrs: null, nullablePipeStrs: null }))

	await startCase('form-objects-values')
	await call(() => FormApi.formObjects({ obj: aPlainObject(), explodeObj: anObject(), deepObj: anotherObject() }))

	await startCase('form-objects-null')
	await call(() => FormApi.formObjects({ nullableObj: null, nullableExplodeObj: null, nullableDeepObj: null }))

	await startCase('form-arrays-delimited-explode')
	await call(() => FormApi.formDelimitedExplode({ pipeStrs: ['a', 'b'], spaceStrs: ['c', 'd'] }))

	await startCase('form-optional-absent')
	await call(() => FormApi.formOptional(undefined))

	await startCase('multipart-values')
	await call(() => MultipartApi.multipartParts({ text: 'a', json: anObject(), file: { value: 'file content' } }))

	await startCase('multipart-json-content-type')
	await call(() => MultipartApi.multipartParts({ json: anObject() }))

	await startCase('multipart-null')
	await call(() => MultipartApi.multipartParts({ nullableText: null, nullableJson: null, nullableFile: null }))

	await startCase('json-null-properties')
	await call(() => JsonApi.jsonBody({
		name: 'n',
		nullableName: null,
		nullableCount: null,
		nullableWhen: null,
		nullableChild: null,
		nullableList: null,
	}))

	await startCase('json-absent-properties')
	await call(() => JsonApi.jsonBody({ name: 'n' }))

	await startCase('body-array')
	await call(() => BodyApi.bodyArray([anObject(), anotherObject()]))

	await startCase('body-text')
	await call(() => BodyApi.bodyText(TEXT_BODY))

	await startCase('body-binary')
	await call(() => BodyApi.bodyBinary(BINARY_BODY))

	await startCase('body-shared-model')
	await call(() => BodyApi.bodySharedJson({ name: 'j', tags: ['a', 'b'] }))
	await call(() => BodyApi.bodySharedForm({ name: 'f', tags: ['c', 'd'] }))

	await startCase('response-json')
	await call(() => ResponseApi.responseJson())

	await startCase('response-content-type-charset')
	await call(() => ResponseApi.responseJson())

	await startCase('response-unknown-property')
	await call(() => ResponseApi.responseJson())

	await startCase('response-array')
	await call(() => ResponseApi.responseArray())

	await startCase('response-null-properties')
	await call(async() => {
		const result = await ResponseApi.responseNullable()
		return result.status === 200 ? { status: 200, body: statesOf(result.body) } : result
	})

	await startCase('response-headers')
	await call(async() => {
		const result = await ResponseApi.responseHeaders()
		if (result.status !== 200) {
			return result
		}
		return { status: 200, body: headerStates(result.body.name, result.headers.xTotalCount, result.headers.xNote) }
	})

	await startCase('response-empty-body')
	await call(() => ResponseApi.responseJson())

	await startCase('response-no-content-type')
	await call(() => ResponseApi.responseJson())

	await startCase('response-none')
	await call(() => ResponseApi.responseNone())

	await startCase('response-error')
	await call(() => ResponseApi.responseError())

	await startCase('response-error-body')
	await call(() => ResponseApi.responseError())

	await startCase('response-error-headers')
	await call(async() => {
		const result = await ResponseApi.responseError()
		if (result.status !== 400) {
			return result
		}
		/* The harness reads the outcome from the status, so the report travels under a 200 */
		return { status: 200, body: errorHeaderStates(result.headers.xErrorCode) }
	})

	await startCase('response-header-list')
	await call(async() => {
		const result = await ResponseApi.responseHeaderTypes()
		if (result.status !== 200) {
			return result
		}
		return { status: 200, body: headerTypeStates(result.body.name, result.headers.xIds, result.headers.xCount) }
	})

	await startCase('response-header-required-absent')
	await call(() => ResponseApi.responseHeaderTypes())

	await startCase('response-header-unparseable')
	await call(() => ResponseApi.responseHeaderTypes())

	await startCase('response-undocumented-status')
	await call(() => ResponseApi.responseJson())

	await startCase('security-api-key-header')
	await call(() => SecurityApi.securityApiKeyHeader())

	await startCase('security-api-key-query')
	await call(() => SecurityApi.securityApiKeyQuery())

	await startCase('security-bearer')
	await call(() => SecurityApi.securityBearer())

	await startCase('security-basic')
	await call(() => SecurityApi.securityBasic())
}

drive(main)
