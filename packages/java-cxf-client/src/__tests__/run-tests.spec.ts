import { CONFORMANCE_SPEC } from '@openapi-generator-plus/client-conformance/dist/testing'
import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'
import Maven from 'maven'
import { DEFAULT_CONFIG, prepare } from './common'

/*
 * `compile.spec` only compiles the generated tests. This runs them, so the suite also
 * covers the JUnit and Surefire configuration that the generated pom declares.
 *
 * It uses the conformance API, because that declares a server and several operation
 * groups. A generated test builds a client for the default server, and a fault in the test
 * configuration may need more than one test class to show itself.
 */
test('the generated project runs its own tests', async() => {
	const result = await prepare(CONFORMANCE_SPEC, { ...DEFAULT_CONFIG, includeTests: true })

	await testGenerate(result, {
		testName: 'run-tests',
		postProcess: async(basePath) => {
			const mvn = Maven.create({ cwd: basePath, quiet: true })
			await mvn.execute('test')
		},
	})
})
