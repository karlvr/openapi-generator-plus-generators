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
import { Api, FormApi, JsonApi, MultipartApi, QueryApi, ResponseApi } from './index'

const WHEN = '2020-01-02T03:04:05.678Z'
const DAY = '2020-01-02'
const PATH_SEGMENT = 'a b/c?d#e&f+g%h:i@j'

function anObject(): Api.QueryObject {
	return { name: 'x', count: 1, when: WHEN }
}

/** A joined style writes every property into one value, so it needs values that no style has to encode. */
function aPlainObject(): Api.QueryObject {
	return { name: 'x', count: 1 }
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

	await startCase('query-scalars-values')
	await call(() => query.queryScalars('hello world', 42, 1.5, false, new Date(WHEN), DAY))

	await startCase('query-scalars-absent')
	await call(() => query.queryScalars(undefined, undefined, undefined, undefined, undefined, undefined))

	await startCase('query-scalars-empty-string')
	await call(() => query.queryScalars('', undefined, undefined, undefined, undefined, undefined))

	await startCase('query-arrays-form')
	await call(() => query.queryArrays(['a', 'b'], ['a', 'b'], undefined, undefined, [new Date(WHEN), new Date(WHEN)]))

	await startCase('query-arrays-delimited')
	await call(() => query.queryArrays(undefined, undefined, ['a', 'b'], ['a', 'b'], undefined))

	await startCase('query-arrays-empty')
	await call(() => query.queryArrays([], [], undefined, undefined, []))

	await startCase('query-objects-values')
	await call(() => query.queryObjects(anObject(), aPlainObject(), anObject()))

	await startCase('joined-values-encoded-once')
	await call(() => query.queryArrays(['a b'], ['a b'], undefined, undefined, undefined))
	await call(() => query.queryObjects(undefined, { name: 'a b', when: WHEN }, undefined))

	await startCase('query-headers-values')
	await call(() => query.queryHeaders('hello', [1, 2]))

	await startCase('query-path-segment')
	await call(() => query.queryPathSegment(PATH_SEGMENT))

	await startCase('form-scalars-values')
	await call(() => form.formScalars({ str: 'a', num: 1, flag: false, when: WHEN }))

	await startCase('form-scalars-null')
	await call(() => form.formScalars({ nullableStr: null, nullableNum: null, nullableFlag: null, nullableWhen: null }))

	await startCase('form-scalars-absent')
	await call(() => form.formScalars({}))

	await startCase('form-arrays-values')
	await call(() => form.formArrays({ strs: ['a', 'b'], pipeStrs: ['a', 'b'] }))

	await startCase('form-arrays-null')
	await call(() => form.formArrays({ nullableStrs: null, nullablePipeStrs: null }))

	await startCase('form-objects-values')
	await call(() => form.formObjects({ obj: aPlainObject(), explodeObj: anObject(), deepObj: anObject() }))

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

	await startCase('response-json')
	await call(() => response.responseJson())

	await startCase('response-none')
	await call(() => response.responseNone())

	await startCase('response-error')
	await call(() => response.responseError())
}

main().then(() => {
	fs.writeFileSync(resultsPath, JSON.stringify({ cases: results }, null, 2))
}, (error) => {
	console.error(error)
	fs.writeFileSync(resultsPath, JSON.stringify({ cases: results }, null, 2))
	process.exit(1)
})
