import { CannedResponse, RecordedRequest } from './server'

/**
 * What a generated client made of one response, in a form that every driver
 * reports the same way.
 *
 * A generated client reports a response differently in each language, and even
 * between two generators for one language. A driver maps its client's result
 * onto this shape, so one expectation can cover every client.
 */
export interface DriverCall {
	/**
	 * `success` when the client reported a successful response. `error` when the
	 * client reported a documented failure, such as a `400`. `exception` when the
	 * client threw something else, which usually means a defect.
	 */
	outcome: 'success' | 'error' | 'exception'
	/** The status code, when the client exposes one. */
	httpStatus?: number
	/** The value that the client produced, as JSON. A `Date` appears as its ISO text. */
	value?: unknown
	/** The message of an exception. */
	error?: string
}

/** What a driver reported for one case. */
export interface DriverCaseResult {
	id: string
	calls: DriverCall[]
}

/** The file that a driver writes when it finishes. */
export interface DriverResults {
	cases: DriverCaseResult[]
}

/**
 * One conformance case: a set of calls that a driver makes, and what the suite
 * expects to see.
 *
 * A case owns its whole exchange. The server records every request that arrives
 * during the case, and replies with {@link ConformanceCase.response}. A driver
 * announces the case, makes its calls, then reports what each call produced.
 */
export interface ConformanceCase {
	/** The case id. A driver matches on this, so it must not change. */
	id: string
	/** What the case shows. This appears as the test name. */
	description: string
	/** The response that the server sends during this case. */
	response?: CannedResponse
	/** Assert on what the client sent. */
	expectRequests?(requests: RecordedRequest[]): void
	/** Assert on what the client made of each response. */
	expectCalls?(calls: DriverCall[]): void
	/**
	 * The drivers that cannot run this case, each with the reason. Use this only
	 * where a client cannot express the case at all, not to accept a defect.
	 */
	skipDrivers?: Record<string, string>
	/**
	 * The drivers that fail this case because of a known defect, each with the
	 * reason.
	 *
	 * The suite expects such a test to fail. So a known defect keeps the suite
	 * green, and the suite still reports when someone fixes the defect. Remove the
	 * entry with the fix.
	 */
	knownDefects?: Record<string, string>
}
