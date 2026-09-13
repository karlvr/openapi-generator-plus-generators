/*
 * The scaffold that every driver of the typescript-fetch-client family builds
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
export async function call(operation: () => Promise<unknown>): Promise<void> {
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
