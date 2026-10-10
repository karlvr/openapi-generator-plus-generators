import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'
import { createCodegenResult } from '@openapi-generator-plus/testing'
import { CodegenConfig, CodegenGeneratorConstructor } from '@openapi-generator-plus/types'
import { promises as fs } from 'fs'
import * as os from 'os'
import * as path from 'path'
import { ConformanceDriver, DRIVERS } from './drivers'
import { CannedResponse, ConformanceServer, CONFORMANCE_BASE_PATH, RecordedRequest, startConformanceServer } from './server'
import { CONFORMANCE } from './suites/conformance'
import { SUITES } from './suites'
import { ConformanceCase, ConformanceSuite, DriverResults, ExpectedRequest } from './types'

/**
 * The spec of the general conformance suite.
 *
 * It declares an operation for every kind of parameter, body and response, so it
 * is the widest spec in this package. Use it where a test wants to compile a
 * generated project that exercises all of a generator's templates.
 */
export const CONFORMANCE_SPEC = CONFORMANCE.spec

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
	/**
	 * The driver that calls this generator's clients: the name of one in `DRIVERS`,
	 * or a driver of the caller's own.
	 */
	driver: string | ConformanceDriver
	/** The config to generate with. The suite adds nothing to it. */
	config: CodegenConfig
	/** The suite to run. See `SUITES`. */
	suite: ConformanceSuite
	/**
	 * The name of the output directory. The default is the suite id. Give one when
	 * a package runs a suite more than once.
	 */
	testName?: string
	/**
	 * The cases that fail with this driver because of a known defect, each with the
	 * reason, by case id. These add to the known defects that a case declares
	 * itself.
	 *
	 * Use this for a driver that the cases do not name, such as one from another
	 * repository. Each id must name a case in one of the `SUITES`, so an entry
	 * cannot outlive its case unnoticed.
	 */
	knownDefects?: Record<string, string>
	/**
	 * The cases that this driver cannot express at all, each with the reason, by
	 * case id. These add to the drivers that a case skips itself. The same rule
	 * applies as for {@link ConformanceOptions.knownDefects}.
	 */
	skipCases?: Record<string, string>
}

/** The driver that `driver` names, or `driver` itself. */
function resolveDriver(driver: string | ConformanceDriver): ConformanceDriver {
	if (typeof driver !== 'string') {
		return driver
	}
	const named = DRIVERS[driver]
	if (!named) {
		throw new Error(`Unknown conformance driver "${driver}". Known drivers: ${Object.keys(DRIVERS).join(', ')}`)
	}
	return named
}

/** Fail when `entries` names a case that no suite declares. `option` names the option, for the message. */
function checkCaseIds(entries: Record<string, string> | undefined, option: string): void {
	const known = new Set(SUITES.flatMap(one => one.cases.map(conformanceCase => conformanceCase.id)))
	const unknown = Object.keys(entries ?? {}).filter(id => !known.has(id))
	if (unknown.length > 0) {
		throw new Error(`${option} names cases that no suite declares: ${unknown.join(', ')}`)
	}
}

/**
 * Declare the tests of one conformance suite for one generator.
 *
 * Call this at the top level of a spec file in a generator package, once for each
 * suite. It generates the suite's API, builds it, and calls every operation
 * against a recording server. One test then reports each case.
 *
 * The suite needs a built `client-conformance` package, because it reads the
 * driver sources and the spec from the package directory.
 */
export function runConformanceTests(options: ConformanceOptions): void {
	const driver = resolveDriver(options.driver)
	checkCaseIds(options.knownDefects, 'knownDefects')
	checkCaseIds(options.skipCases, 'skipCases')

	const { suite } = options
	const CASES = suite.cases

	/** Why `conformanceCase` skips this driver, or undefined when it runs. */
	function skipReason(conformanceCase: ConformanceCase): string | undefined {
		return options.skipCases?.[conformanceCase.id] ?? conformanceCase.skipDrivers?.[driver.name]
	}

	/** The known defect that makes `conformanceCase` fail with this driver, or undefined. */
	function defectReason(conformanceCase: ConformanceCase): string | undefined {
		return options.knownDefects?.[conformanceCase.id] ?? conformanceCase.knownDefects?.[driver.name]
	}

	describe(`client conformance: ${suite.id} (${driver.name})`, () => {
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

			const result = await createCodegenResult(suite.spec, options.config, options.createGenerator)
			const resultsPath = path.join(os.tmpdir(), `conformance-results-${suite.id}-${process.pid}-${Date.now()}.json`)

			await testGenerate(result, {
				testName: options.testName || suite.id,
				postProcess: async(basePath) => {
					await driver.install(basePath, suite)
					await driver.run(basePath, suite, startedServer.baseUrl, resultsPath)
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
				.filter(one => !skipReason(one))
				.map(one => one.id)
			expect(results.cases.map(one => one.id)).toEqual(expected)
		})

		test('the driver announces a case before it calls', () => {
			expect(server!.unattributedRequests()).toEqual([])
		})

		for (const conformanceCase of CASES) {
			const skipped = skipReason(conformanceCase)
			const defect = defectReason(conformanceCase)

			/*
			 * A known defect must still fail. So the suite stays green, and it reports
			 * as soon as someone fixes the generator and forgets to remove the entry.
			 */
			const declare = skipped ? test.skip : defect ? test.failing : test
			const name = defect
				? `${conformanceCase.id}: ${conformanceCase.description} [known defect: ${defect}]`
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
