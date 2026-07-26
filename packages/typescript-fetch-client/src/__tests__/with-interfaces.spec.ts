import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'
import { compile, prepare, DEFAULT_CONFIG } from './common'
import path from 'path'

/*
 * The withInterfaces option has no coverage in the main compile sweep. These specs include
 * operations with and without request bodies, so the generated ApiInterface declarations
 * must agree with the Api classes that implement them for the output to compile.
 */
const SPECS = ['parameters.yml', 'multipart.yml', 'binary.yml']

describe('compile with interfaces', () => {
	const basePath = path.join(__dirname, '..', '..', '..', '..', '__tests__', 'specs')

	for (const file of SPECS) {
		test(file, async() => {
			const result = await prepare(path.join(basePath, file), {
				...DEFAULT_CONFIG,
				withInterfaces: true,
			})
			await testGenerate(result, { postProcess: compile, testName: `with-interfaces/${file}` })
		})
	}
})
