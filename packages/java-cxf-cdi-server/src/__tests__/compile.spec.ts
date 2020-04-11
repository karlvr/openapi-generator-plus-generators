import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'
import { compile, prepare } from './common'
import fs from 'fs'
import path from 'path'

const basePath = path.join(__dirname, 'specs')
const files = fs.readdirSync(basePath)

for (const file of files) {
	test(file, async() => {
		const result = await prepare(path.join(basePath, file))
		await testGenerate(result, compile, path.join('output', file))
	}, 20000)
}
