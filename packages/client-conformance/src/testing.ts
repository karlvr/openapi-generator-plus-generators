import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'
import { createCodegenResult } from '@openapi-generator-plus/testing'
import { CodegenConfig, CodegenGeneratorConstructor } from '@openapi-generator-plus/types'
import { promises as fs } from 'fs'
import * as os from 'os'
import * as path from 'path'
import { CASES } from './cases'
import { DRIVERS } from './drivers'
import { CannedResponse, ConformanceServer, CONFORMANCE_BASE_PATH, RecordedRequest, startConformanceServer } from './server'
import { DriverResults, ExpectedRequest } from './types'

/** The spec that every conformance case calls. */
export const CONFORMANCE_SPEC = path.join(__dirname, '..', 'specs', 'conformance.yml')

/** Generating, installing and building a client takes a while. */
const TIMEOUT = 600000

/** The text of `value`, escaped so that a regular expression matches it exactly. */
function escapeForRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** The pattern that a request line must match to satisfy `expected`. */
function requestLinePattern(expected: ExpectedRequest): RegExp {
	const path = typeof expected.path === 'string' ? escapeForRegExp(expected.path) : `(?:${expected.path.source})`
	return new RegExp(`^${escapeForRegExp(`${expected.method} ${CONFORMANCE_BASE_PATH}`)}${path}$`)
}

/**
 * Check the method and the path of each request, in the order that they arrived.
 *
 * A request line holds the method and the path together, so a failure names the
 * request that arrived rather than one field of it.
 */
function expectRequestLines(requests: RecordedRequest[], expected: ExpectedRequest[]): void {
	expect(requests.map(request => `${request.method} ${request.path}`)).toHaveLength(expected.length)

	expected.forEach((one, index) => {
		expect(`${requests[index].method} ${requests[index].path}`).toMatch(requestLinePattern(one))
	})
}

/** How to run the conformance suite against one generator. */
export interface ConformanceOptions {
	/** The generator under test. */
	createGenerator: CodegenGeneratorConstructor
	/** The name of the driver that calls this generator's clients. See `DRIVERS`. */
	driver: string
	/** The config to generate with. The suite adds nothing to it. */
	config: CodegenConfig
	/** The name of the output directory. Give one when a package runs the suite more than once. */
	testName?: string
}

/**
 * Declare the client conformance tests for one generator.
 *
 * Call this at the top level of a spec file in a generator package. It generates
 * the conformance API, builds it, and calls every operation against a recording
 * server. One test then reports each case.
 *
 * The suite needs a built `client-conformance` package, because it reads the
 * driver sources and the spec from the package directory.
 */
export function runConformanceTests(options: ConformanceOptions): void {
	const driver = DRIVERS[options.driver]
	if (!driver) {
		throw new Error(`Unknown conformance driver "${options.driver}". Known drivers: ${Object.keys(DRIVERS).join(', ')}`)
	}

	describe(`client conformance (${options.driver})`, () => {
		let server: ConformanceServer | undefined
		let results: DriverResults = { cases: [] }

		beforeAll(async() => {
			const responses: Record<string, CannedResponse> = {}
			for (const conformanceCase of CASES) {
				if (conformanceCase.response) {
					responses[conformanceCase.id] = conformanceCase.response
				}
			}

			server = await startConformanceServer(responses)
			const startedServer = server

			const result = await createCodegenResult(CONFORMANCE_SPEC, options.config, options.createGenerator)
			const resultsPath = path.join(os.tmpdir(), `conformance-results-${process.pid}-${Date.now()}.json`)

			await testGenerate(result, {
				testName: options.testName || 'conformance',
				postProcess: async(basePath) => {
					await driver.install(basePath)
					await driver.run(basePath, startedServer.baseUrl, resultsPath)
				},
			})

			results = JSON.parse(await fs.readFile(resultsPath, 'utf-8')) as DriverResults
			await fs.unlink(resultsPath)
		}, TIMEOUT)

		afterAll(async() => {
			if (server) {
				await server.close()
			}
		})

		/*
		 * The suite matches a driver's report to a case by its id. So a report that
		 * carries an id that no case declares would otherwise go unnoticed, and a
		 * mistyped id would only show as a case that reported nothing.
		 */
		test('the driver reports every case that it runs, and no other', () => {
			const expected = CASES
				.filter(one => !(one.skipDrivers && one.skipDrivers[options.driver]))
				.map(one => one.id)
			expect(results.cases.map(one => one.id)).toEqual(expected)
		})

		test('the driver announces a case before it calls', () => {
			expect(server!.unattributedRequests()).toEqual([])
		})

		for (const conformanceCase of CASES) {
			const skipReason = conformanceCase.skipDrivers && conformanceCase.skipDrivers[options.driver]
			const defectReason = conformanceCase.knownDefects && conformanceCase.knownDefects[options.driver]

			/*
			 * A known defect must still fail. So the suite stays green, and it reports
			 * as soon as someone fixes the generator and forgets to remove the entry.
			 */
			const declare = skipReason ? test.skip : defectReason ? test.failing : test
			const name = defectReason
				? `${conformanceCase.id}: ${conformanceCase.description} [known defect: ${defectReason}]`
				: `${conformanceCase.id}: ${conformanceCase.description}`

			declare(name, () => {
				const reported = results.cases.filter(one => one.id === conformanceCase.id)
				expect(reported).toHaveLength(1)

				/*
				 * A call that threw says more than any assertion that follows it, because
				 * a client that threw may have sent nothing at all. A case that asserts on
				 * the calls itself decides what an exception means.
				 */
				if (!conformanceCase.expectCalls) {
					for (const call of reported[0].calls) {
						if (call.outcome === 'exception') {
							throw new Error(`The client threw an unexpected error: ${call.error}`)
						}
					}
				}

				const requests = server!.requests(conformanceCase.id)
				expectRequestLines(requests, conformanceCase.requests)
				if (conformanceCase.expectRequests) {
					conformanceCase.expectRequests(requests)
				}
				if (conformanceCase.expectCalls) {
					conformanceCase.expectCalls(reported[0].calls)
				}
			})
		}
	})
}
