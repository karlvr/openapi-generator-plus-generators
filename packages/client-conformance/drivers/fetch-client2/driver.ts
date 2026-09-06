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
 * Run it as: node dist/driver.js <baseUrl> <resultsPath>
 */

import * as fs from 'fs'
import { Api, Configuration, FormApi, JsonApi, MultipartApi, QueryApi, ResponseApi, setDefaultConfiguration } from './index'

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

/**
 * The part of every operation response that the driver reads.
 *
 * Each operation declares its own response union. They all carry a `status`,
 * which is the status code for a documented response, and a word for anything
 * else.
 */
interface AnyResponse {
	status: number | 'undocumented' | 'error' | 'unauthorized'
	body?: unknown
	error?: unknown
	contentType?: string | undefined
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

/** Make one call, and record what the client produced. */
async function call(operation: () => Promise<AnyResponse>): Promise<void> {
	try {
		const response = await operation()
		if (typeof response.status === 'number') {
			if (response.status >= 400) {
				calls.push({ outcome: 'error', httpStatus: response.status })
			} else {
				calls.push({ outcome: 'success', httpStatus: response.status, value: response.body })
			}
		} else if (response.status === 'error') {
			const error = response.error
			calls.push({ outcome: 'exception', error: error instanceof Error ? error.message : String(error) })
		} else {
			calls.push({ outcome: 'exception', error: `The client reported a ${response.status} response of type ${response.contentType}` })
		}
	} catch (error) {
		calls.push({ outcome: 'exception', error: error instanceof Error ? error.message : String(error) })
	}
}

async function main(): Promise<void> {
	setDefaultConfiguration(new Configuration({ baseUri: baseUrl }))

	await startCase('query-scalars-values')
	await call(() => QueryApi.queryScalars({ str: 'hello world', num: 42, dbl: 1.5, flag: false, when: new Date(WHEN), day: DAY }))

	await startCase('query-scalars-absent')
	await call(() => QueryApi.queryScalars({}))

	await startCase('query-scalars-empty-string')
	await call(() => QueryApi.queryScalars({ str: '' }))

	await startCase('query-arrays-form')
	await call(() => QueryApi.queryArrays({
		formExplode: ['a', 'b'],
		formNoExplode: ['a', 'b'],
		dateTimes: [new Date(WHEN), new Date(WHEN)],
	}))

	await startCase('query-arrays-delimited')
	await call(() => QueryApi.queryArrays({ pipe: ['a', 'b'], space: ['a', 'b'] }))

	await startCase('query-arrays-empty')
	await call(() => QueryApi.queryArrays({ formExplode: [], formNoExplode: [], dateTimes: [] }))

	await startCase('query-objects-values')
	await call(() => QueryApi.queryObjects({ explode: anObject(), noExplode: aPlainObject(), deep: anObject() }))

	await startCase('joined-values-encoded-once')
	await call(() => QueryApi.queryArrays({ formExplode: ['a b'], formNoExplode: ['a b'] }))
	await call(() => QueryApi.queryObjects({ noExplode: { name: 'a b', when: WHEN } }))

	await startCase('query-headers-values')
	await call(() => QueryApi.queryHeaders({ xText: 'hello', xNumbers: [1, 2] }))

	await startCase('query-path-segment')
	await call(() => QueryApi.queryPathSegment(PATH_SEGMENT))

	await startCase('form-scalars-values')
	await call(() => FormApi.formScalars({ str: 'a', num: 1, flag: false, when: WHEN }))

	await startCase('form-scalars-null')
	await call(() => FormApi.formScalars({ nullableStr: null, nullableNum: null, nullableFlag: null, nullableWhen: null }))

	await startCase('form-scalars-absent')
	await call(() => FormApi.formScalars({}))

	await startCase('form-arrays-values')
	await call(() => FormApi.formArrays({ strs: ['a', 'b'], pipeStrs: ['a', 'b'] }))

	await startCase('form-arrays-null')
	await call(() => FormApi.formArrays({ nullableStrs: null, nullablePipeStrs: null }))

	await startCase('form-objects-values')
	await call(() => FormApi.formObjects({ obj: aPlainObject(), explodeObj: anObject(), deepObj: anObject() }))

	await startCase('form-objects-null')
	await call(() => FormApi.formObjects({ nullableObj: null, nullableExplodeObj: null, nullableDeepObj: null }))

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

	await startCase('response-json')
	await call(() => ResponseApi.responseJson())

	await startCase('response-none')
	await call(() => ResponseApi.responseNone())

	await startCase('response-error')
	await call(() => ResponseApi.responseError())
}

main().then(() => {
	fs.writeFileSync(resultsPath, JSON.stringify({ cases: results }, null, 2))
}, (error) => {
	console.error(error)
	fs.writeFileSync(resultsPath, JSON.stringify({ cases: results }, null, 2))
	process.exit(1)
})
