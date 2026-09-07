import * as http from 'http'
import { AddressInfo } from 'net'

/**
 * One request that a generated client sent, exactly as it arrived.
 *
 * The suite asserts against these fields, so they hold raw text rather than a
 * parsed structure. Use the helpers in `parse` to read a query string, a form
 * body or a multipart body.
 */
export interface RecordedRequest {
	/** The request method, in upper case. */
	method: string
	/** The request path, without the query string, and still percent encoded. */
	path: string
	/** The query string, without the leading `?`. An empty string means the request had none. */
	query: string
	/** The request headers. A name is lower case. A repeated header keeps each value, in order. */
	headers: Record<string, string[]>
	/** The request body, decoded as UTF-8. An empty string means the request had no body. */
	body: string
	/** The request body, as base64. Use this for a binary body. */
	bodyBase64: string
}

/**
 * The response that the server sends for a case.
 *
 * A case that omits a field gets the default, which is a `200` with an empty
 * JSON object.
 */
export interface CannedResponse {
	status?: number
	/** Headers to send. A `content-type` of `null` sends no `Content-Type` header. */
	headers?: Record<string, string | null>
	body?: string
}

/** The path that a driver posts to, to say which case it is about to run. Relative to the base path. */
export const CASE_CONTROL_PATH = '/__conformance/case'

/**
 * The path that the conformance server serves under.
 *
 * A real server URL usually carries a path, and a client must keep that path in
 * front of every operation path. A client that drops it still reaches this
 * server, so the server serves under a base path to make the mistake visible.
 *
 * A recorded request holds the path exactly as it arrived, so it includes this
 * prefix.
 */
export const CONFORMANCE_BASE_PATH = '/api/v1'

const DEFAULT_RESPONSE: Required<Pick<CannedResponse, 'status' | 'body'>> = {
	status: 200,
	body: '{}',
}

/**
 * A recording HTTP server for the client conformance suite.
 *
 * The server answers every request. It records each one against the case that
 * the driver last announced, so a test can read back what the client sent. It
 * replies with the canned response of that case, so a test can also check what
 * the client makes of a response.
 *
 * Start one with {@link startConformanceServer}. Close it when the suite ends.
 */
export interface ConformanceServer {
	/**
	 * The base URL to give to the generated client. It carries a path, and it has
	 * no trailing slash.
	 */
	readonly baseUrl: string
	/** The requests that arrived during `caseId`, in the order that they arrived. */
	requests(caseId: string): RecordedRequest[]
	/** The requests that arrived before any driver announced a case. */
	unattributedRequests(): RecordedRequest[]
	close(): Promise<void>
}

/**
 * Start a {@link ConformanceServer} on a free port.
 *
 * @param responses the response to send during each case, by case id
 */
export function startConformanceServer(responses: Record<string, CannedResponse> = {}): Promise<ConformanceServer> {
	const recorded: Record<string, RecordedRequest[]> = {}
	const unattributed: RecordedRequest[] = []
	let currentCase: string | undefined

	const server = http.createServer((req, res) => {
		readBody(req).then((body) => {
			if (req.url === `${CONFORMANCE_BASE_PATH}${CASE_CONTROL_PATH}` && req.method === 'POST') {
				currentCase = body.toString('utf-8')
				if (!recorded[currentCase]) {
					recorded[currentCase] = []
				}
				res.writeHead(200).end()
				return
			}

			record(req, body)
			respond(res)
		}).catch((error) => {
			res.writeHead(500, { 'Content-Type': 'text/plain' }).end(String(error))
		})
	})

	function record(req: http.IncomingMessage, body: Buffer): void {
		const url = req.url || '/'
		const queryStart = url.indexOf('?')

		const request: RecordedRequest = {
			method: (req.method || 'GET').toUpperCase(),
			path: queryStart !== -1 ? url.substring(0, queryStart) : url,
			query: queryStart !== -1 ? url.substring(queryStart + 1) : '',
			headers: headersOf(req),
			body: body.toString('utf-8'),
			bodyBase64: body.toString('base64'),
		}

		if (currentCase !== undefined) {
			recorded[currentCase].push(request)
		} else {
			unattributed.push(request)
		}
	}

	function respond(res: http.ServerResponse): void {
		const canned = (currentCase !== undefined ? responses[currentCase] : undefined) || {}
		const status = canned.status !== undefined ? canned.status : DEFAULT_RESPONSE.status
		const body = canned.body !== undefined ? canned.body : DEFAULT_RESPONSE.body

		const headers: Record<string, string> = {}
		let contentTypeGiven = false
		for (const name of Object.keys(canned.headers || {})) {
			const value = canned.headers![name]
			if (name.toLowerCase() === 'content-type') {
				contentTypeGiven = true
			}
			if (value !== null) {
				headers[name] = value
			}
		}
		if (!contentTypeGiven && status !== 204) {
			headers['Content-Type'] = 'application/json'
		}

		res.writeHead(status, headers)
		if (status !== 204 && body) {
			res.end(body)
		} else {
			res.end()
		}
	}

	return new Promise((resolve, reject) => {
		server.on('error', reject)
		server.listen(0, '127.0.0.1', () => {
			const address = server.address() as AddressInfo
			resolve({
				baseUrl: `http://127.0.0.1:${address.port}${CONFORMANCE_BASE_PATH}`,
				requests: (caseId) => recorded[caseId] || [],
				unattributedRequests: () => unattributed,
				close: () => new Promise((resolveClose, rejectClose) => {
					server.closeAllConnections()
					server.close((error) => error ? rejectClose(error) : resolveClose())
				}),
			})
		})
	})
}

function headersOf(req: http.IncomingMessage): Record<string, string[]> {
	const result: Record<string, string[]> = {}
	const raw = req.rawHeaders
	for (let i = 0; i < raw.length; i += 2) {
		const name = raw[i].toLowerCase()
		if (!result[name]) {
			result[name] = []
		}
		result[name].push(raw[i + 1])
	}
	return result
}

function readBody(req: http.IncomingMessage): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = []
		req.on('data', (chunk: Buffer) => chunks.push(chunk))
		req.on('end', () => resolve(Buffer.concat(chunks)))
		req.on('error', reject)
	})
}
