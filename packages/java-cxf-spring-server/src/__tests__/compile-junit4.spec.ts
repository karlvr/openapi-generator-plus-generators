import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'
import { compile, prepare, DEFAULT_CONFIG } from './common'
import fs from 'fs'
import path from 'path'

const basePath = path.join(__dirname, '..', '..', '..', '..', '__tests__', 'specs')
const files = fs.readdirSync(basePath)

for (const file of files) {
	test(file, async() => {
		const result = await prepare(path.join(basePath, file), {
			...DEFAULT_CONFIG,
			includeTests: true,
			junitVersion: 4,
		})
		await testGenerate(result, compile, path.join('test-output/junit4', file))
	}, 20000)
}
