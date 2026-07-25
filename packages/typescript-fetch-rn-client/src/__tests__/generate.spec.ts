import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'
import { prepare } from './common'
import path from 'path'
import { globSync } from 'glob'

describe('generate test cases', () => {
	const basePath = path.join(__dirname, '..', '..', '..', '..', '__tests__', 'specs')
	const files = globSync('**/*.{yml,yaml}', { cwd: basePath })

	for (const file of files) {
		test(file, async() => {
			const result = await prepare(path.join(basePath, file))
			await testGenerate(result, { testName: file })
		})
	}
})
