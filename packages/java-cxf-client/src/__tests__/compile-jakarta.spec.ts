import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'
import { compile, prepare, DEFAULT_CONFIG } from './common'
import path from 'path'
import { globSync } from 'glob'

describe('compile test cases with jakarta', () => {
	const basePath = path.join(__dirname, '..', '..', '..', '..', '__tests__', 'specs')
	const files = globSync('**/*.{yml,yaml}', { cwd: basePath })

	for (const file of files) {
		test(file, async() => {
			const result = await prepare(path.join(basePath, file), {
				...DEFAULT_CONFIG,
				includeTests: true,
				useJakarta: true,
			})
			await testGenerate(result, { postProcess: compile, testName: `jakarta/${file}` })
		})
	}
})
