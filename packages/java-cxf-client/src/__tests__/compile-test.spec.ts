import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'
import { prepare, DEFAULT_CONFIG, compileAndTest } from './common'
import fs from 'fs'
import path from 'path'

const basePath = path.join(__dirname, '..', '..', '..', '..', '__tests__', 'specs')
const files = fs.readdirSync(basePath)

for (const file of files) {
	test(file, async() => {
		const result = await prepare(path.join(basePath, file), {
			...DEFAULT_CONFIG,
			includeTests: true,
		})
		await testGenerate(result, compileAndTest)
	}, 20000)
}
