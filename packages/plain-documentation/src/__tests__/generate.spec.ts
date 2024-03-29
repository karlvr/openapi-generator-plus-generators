import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'
import { prepare, DEFAULT_CONFIG } from './common'
import fs from 'fs'
import path from 'path'

describe('generate test cases', () => {
	const basePath = path.join(__dirname, '..', '..', '..', '..', '__tests__', 'specs')
	const files = fs.readdirSync(basePath)

	for (const file of files) {
		test(file, async() => {
			const result = await prepare(path.join(basePath, file), {
				...DEFAULT_CONFIG,
				includeTests: true,
			})
			await testGenerate(result, { testName: file })
		})
	}
})
