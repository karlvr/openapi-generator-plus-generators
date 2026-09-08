/*
 * The conformance driver for the typescript-fetch-client generator, and for the
 * generators that build on it.
 *
 * The suite copies this file into the generated project, so the project's own
 * compiler checks it against the generated types. A signature change that a
 * caller cannot write then fails the build.
 *
 * The driver only makes calls. It reports what each call produced, and the suite
 * asserts on that, and on what a recording server received.
 *
 * Run it as: node dist/driver.js <baseUrl> <resultsPath>
 */

import * as fs from 'fs'
import { Api, BodyApi, Configuration, FormApi, JsonApi, MultipartApi, QueryApi, ResponseApi, SecurityApi } from './index'

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
 * The credentials that the security cases give the client.
 *
 * The client asks for the credential of one scheme at a time, and names the
 * scheme. Each scheme has its own value, so a client that reads the credential
 * of another scheme shows it.
 */
function credentials(): Configuration {
	return new Configuration({
		apiKey: (name: string) => name === 'apiKeyHeader' ? API_KEY_HEADER : API_KEY_QUERY,
		authorization: (name: string) => name === 'bearerAuth' ? BEARER_TOKEN : null,
		username: BASIC_USERNAME,
		password: BASIC_PASSWORD,
	})
}

interface DriverCall {
	outcome: 'success' | 'error' | 'exception'
	httpStatus?: number
	value?: unknown
	error?: string
}

interface DriverCaseResult {
	id: string
	calls: DriverCall[]
}

const baseUrl = process.argv[2]
const resultsPath = process.argv[3]

const results: DriverCaseResult[] = []
let calls: DriverCall[] = []

/** Tell the server which case is starting, so it records and answers for that case. */
async function startCase(id: string): Promise<void> {
	calls = []
	results.push({ id, calls })
	await fetch(`${baseUrl}/__conformance/case`, { method: 'POST', body: id })
}

/**
 * The status of a value that is an HTTP response, or `undefined` for any other
 * value.
 *
 * Each client in this family carries its own response class. One uses the
 * platform class, and another uses the class of a fetch library. So the driver
 * recognises a response by its shape rather than by its class.
 */
function statusOf(value: unknown): number | undefined {
	if (typeof value === 'object' && value !== null) {
		const candidate = value as { status?: unknown; headers?: { get?: unknown } }
		if (typeof candidate.status === 'number' && candidate.headers && typeof candidate.headers.get === 'function') {
			return candidate.status
		}
	}
	return undefined
}

/** Make one call, and record what the client produced. */
async function call(operation: () => Promise<unknown>): Promise<void> {
	try {
		const value = await operation()
		/*
		 * An operation whose response declares no content resolves with the raw
		 * response. That has nothing to assert, so report no value.
		 */
		calls.push({ outcome: 'success', value: statusOf(value) !== undefined ? undefined : value })
	} catch (error) {
		const status = statusOf(error)
		if (status !== undefined) {
			calls.push({ outcome: 'error', httpStatus: status })
		} else {
			calls.push({ outcome: 'exception', error: error instanceof Error ? error.message : String(error) })
		}
	}
}

async function main(): Promise<void> {
	const query = new QueryApi(undefined, baseUrl)
	const form = new FormApi(undefined, baseUrl)
	const multipart = new MultipartApi(undefined, baseUrl)
	const json = new JsonApi(undefined, baseUrl)
	const response = new ResponseApi(undefined, baseUrl)
	const bodyApi = new BodyApi(undefined, baseUrl)
	const security = new SecurityApi(credentials(), baseUrl)

	await startCase('query-scalars-values')
	await call(() => query.queryScalars('hello world', 42, 1.5, false, new Date(WHEN), DAY))

	await startCase('query-scalars-absent')
	await call(() => query.queryScalars(undefined, undefined, undefined, undefined, undefined, undefined))

	await startCase('query-scalars-empty-string')
	await call(() => query.queryScalars('', undefined, undefined, undefined, undefined, undefined))

	await startCase('query-arrays-form')
	await call(() => query.queryArrays(['a', 'b'], ['c', 'd'], undefined, undefined, [new Date(WHEN), new Date(WHEN)]))

	await startCase('query-arrays-delimited')
	await call(() => query.queryArrays(undefined, undefined, ['a', 'b'], ['c', 'd'], undefined))

	await startCase('query-arrays-empty')
	await call(() => query.queryArrays([], [], undefined, undefined, []))

	await startCase('query-objects-values')
	await call(() => query.queryObjects(anObject(), aPlainObject(), anotherObject()))

	await startCase('joined-values-encoded-once')
	await call(() => query.queryArrays(['a b'], ['a b'], undefined, undefined, undefined))
	await call(() => query.queryObjects(undefined, { name: 'a b', when: WHEN }, undefined))

	await startCase('query-headers-values')
	await call(() => query.queryHeaders('hello', [1, 2]))

	await startCase('query-cookies-values')
	await call(() => query.queryCookies('abc', 'dark'))

	await startCase('query-required-values')
	await call(() => query.queryRequired('needed value', undefined, 'needed header'))

	await startCase('query-path-segment')
	await call(() => query.queryPathSegment(PATH_SEGMENT))

	await startCase('form-scalars-values')
	await call(() => form.formScalars({ str: 'a', num: 1, flag: false, when: WHEN }))

	await startCase('form-scalars-null')
	await call(() => form.formScalars({ nullableStr: null, nullableNum: null, nullableFlag: null, nullableWhen: null }))

	await startCase('form-scalars-absent')
	await call(() => form.formScalars({}))

	await startCase('form-arrays-values')
	await call(() => form.formArrays({ strs: ['a', 'b'], pipeStrs: ['c', 'd'] }))

	await startCase('form-arrays-null')
	await call(() => form.formArrays({ nullableStrs: null, nullablePipeStrs: null }))

	await startCase('form-objects-values')
	await call(() => form.formObjects({ obj: aPlainObject(), explodeObj: anObject(), deepObj: anotherObject() }))

	await startCase('form-objects-null')
	await call(() => form.formObjects({ nullableObj: null, nullableExplodeObj: null, nullableDeepObj: null }))

	await startCase('multipart-values')
	await call(() => multipart.multipartParts({ text: 'a', json: anObject(), file: { value: 'file content' } }))

	await startCase('multipart-json-content-type')
	await call(() => multipart.multipartParts({ json: anObject() }))

	await startCase('multipart-null')
	await call(() => multipart.multipartParts({ nullableText: null, nullableJson: null, nullableFile: null }))

	await startCase('json-null-properties')
	await call(() => json.jsonBody({
		name: 'n',
		nullableName: null,
		nullableCount: null,
		nullableWhen: null,
		nullableChild: null,
		nullableList: null,
	}))

	await startCase('json-absent-properties')
	await call(() => json.jsonBody({ name: 'n' }))

	await startCase('body-array')
	await call(() => bodyApi.bodyArray([anObject(), anotherObject()]))

	await startCase('body-text')
	await call(() => bodyApi.bodyText(TEXT_BODY))

	await startCase('body-binary')
	await call(() => bodyApi.bodyBinary(BINARY_BODY))

	await startCase('response-json')
	await call(() => response.responseJson())

	await startCase('response-content-type-charset')
	await call(() => response.responseJson())

	await startCase('response-unknown-property')
	await call(() => response.responseJson())

	await startCase('response-array')
	await call(() => response.responseArray())

	await startCase('response-null-properties')
	await call(async() => statesOf(await response.responseNullable()))

	await startCase('response-headers')
	await call(async() => {
		/*
		 * The operation resolves with the model alone, so the client exposes no
		 * header. The declared type stops compiling if that ever changes.
		 */
		const model: Api.ResponseObject = await response.responseHeaders()
		return headerStates(model.name, undefined, undefined)
	})

	await startCase('response-empty-body')
	await call(() => response.responseJson())

	await startCase('response-no-content-type')
	await call(() => response.responseJson())

	await startCase('response-none')
	await call(() => response.responseNone())

	await startCase('response-error')
	await call(() => response.responseError())

	await startCase('response-error-body')
	await call(() => response.responseError())

	await startCase('response-undocumented-status')
	await call(() => response.responseJson())

	await startCase('security-api-key-header')
	await call(() => security.securityApiKeyHeader())

	await startCase('security-api-key-query')
	await call(() => security.securityApiKeyQuery())

	await startCase('security-bearer')
	await call(() => security.securityBearer())

	await startCase('security-basic')
	await call(() => security.securityBasic())
}

main().then(() => {
	fs.writeFileSync(resultsPath, JSON.stringify({ cases: results }, null, 2))
}, (error) => {
	console.error(error)
	fs.writeFileSync(resultsPath, JSON.stringify({ cases: results }, null, 2))
	process.exit(1)
})
