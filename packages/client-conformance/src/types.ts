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
	/**
	 * The value that the client produced, as JSON. A `Date` appears as its ISO
	 * text. A documented failure reports the value that the client made of the
	 * failure body, when the client exposes one.
	 */
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
 * The request line that a case expects.
 *
 * A case declares one of these for each request that it makes, in order. So
 * every case checks that the client reached the right resource, which an
 * assertion on the query string alone cannot show.
 */
export interface ExpectedRequest {
	/** The request method, in upper case. */
	method: string
	/**
	 * The operation path, without the server's base path.
	 *
	 * Give a regular expression for a path that carries a value, because each
	 * client may encode that value differently. The suite anchors the expression
	 * to the whole path, so it needs no `^` and no `$`.
	 */
	path: string | RegExp
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
	/**
	 * The requests that the case expects, in the order that they arrive.
	 *
	 * The suite checks the number of requests, and the method and the path of
	 * each. So {@link ConformanceCase.expectRequests} only has to assert on what
	 * the request carries.
	 *
	 * A case that expects no request declares an empty list.
	 */
	requests: ExpectedRequest[]
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
