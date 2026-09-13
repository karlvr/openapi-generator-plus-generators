/*
 * The scaffold that every driver of the typescript-fetch-client2 family builds
 * on: announce a case, make a call, and write the report.
 *
 * The suite copies this file into the generated project next to the entry file
 * of the suite that it runs. Nothing here depends on the generated API, so one
 * copy serves every suite.
 */

import * as fs from 'fs'

export interface DriverCall {
	outcome: 'success' | 'error' | 'exception'
	httpStatus?: number
	value?: unknown
	error?: string
}

export interface DriverCaseResult {
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
export interface AnyResponse {
	status: number | 'undocumented' | 'error' | 'unauthorized'
	body?: unknown
	error?: unknown
	contentType?: string | undefined
	/** The raw response, which an undocumented response carries so that a caller can read its status. */
	response?: { status: number }
}

/** The base URL of the recording server. */
export const baseUrl = process.argv[2]
const resultsPath = process.argv[3]

const results: DriverCaseResult[] = []
let calls: DriverCall[] = []

/** Tell the server which case is starting, so it records and answers for that case. */
export async function startCase(id: string): Promise<void> {
	calls = []
	results.push({ id, calls })
	await fetch(`${baseUrl}/__conformance/case`, { method: 'POST', body: id })
}

/** Make one call, and record what the client produced. */
export async function call(operation: () => Promise<AnyResponse>): Promise<void> {
	try {
		const response = await operation()
		if (typeof response.status === 'number') {
			if (response.status >= 400) {
				calls.push({ outcome: 'error', httpStatus: response.status, value: response.body })
			} else {
				calls.push({ outcome: 'success', httpStatus: response.status, value: response.body })
			}
		} else if (response.status === 'error') {
			const error = response.error
			calls.push({ outcome: 'exception', error: error instanceof Error ? error.message : String(error) })
		} else if (response.status === 'undocumented' && response.response) {
			/* The client reports an undeclared status through the raw response, which carries the code */
			calls.push({ outcome: 'error', httpStatus: response.response.status })
		} else {
			calls.push({ outcome: 'exception', error: `The client reported a ${response.status} response of type ${response.contentType}` })
		}
	} catch (error) {
		calls.push({ outcome: 'exception', error: error instanceof Error ? error.message : String(error) })
	}
}

/**
 * Run the calls of a suite, then write the report.
 *
 * A failure in the calls still writes the report of every case that ran, so the
 * suite can show where the driver stopped.
 */
export function drive(main: () => Promise<void>): void {
	main().then(() => {
		fs.writeFileSync(resultsPath, JSON.stringify({ cases: results }, null, 2))
	}, (error) => {
		console.error(error)
		fs.writeFileSync(resultsPath, JSON.stringify({ cases: results }, null, 2))
		process.exit(1)
	})
}
