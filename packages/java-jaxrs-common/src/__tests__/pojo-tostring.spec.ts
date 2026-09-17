import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'
import { createCodegenResult } from '@openapi-generator-plus/testing'
import createGenerator from '..'
import path from 'path'
import fs from 'fs'
import { CodegenConfig, CodegenGeneratorConstructor, CodegenGeneratorType } from '@openapi-generator-plus/types'

const myCreateGenerator: CodegenGeneratorConstructor = (config, context) => ({
	...createGenerator(config, context),
	generatorType: () => CodegenGeneratorType.SERVER,
})

const DEFAULT_CONFIG: CodegenConfig = {}

const MODEL_PATH = path.join('com', 'example', 'model')

test('pojo toString redacts write-only properties', async() => {
	const result = await createCodegenResult(path.resolve(__dirname, 'pojo-tostring.yml'), DEFAULT_CONFIG, myCreateGenerator)
	await testGenerate(result, {
		testName: 'pojo-tostring/write-only',
		postProcess: async(basePath) => {
			const content = await fs.promises.readFile(path.join(basePath, MODEL_PATH, 'Credentials.java'), 'utf-8')
			expect(content).toContain('sb.append("    secretKey: [redacted]\\n");')
			expect(content).not.toContain('java.util.Objects.toString(this.secretKey')
			expect(content).toContain('java.util.Objects.toString(this.name')
		},
	})
})

test('pojo toString redacts write-only properties with useLombok', async() => {
	const result = await createCodegenResult(path.resolve(__dirname, 'pojo-tostring.yml'), {
		...DEFAULT_CONFIG,
		useLombok: true,
	}, myCreateGenerator)
	await testGenerate(result, {
		testName: 'pojo-tostring/write-only-lombok',
		postProcess: async(basePath) => {
			const content = await fs.promises.readFile(path.join(basePath, MODEL_PATH, 'Credentials.java'), 'utf-8')
			expect(content).toContain('sb.append("    secretKey: [redacted]\\n");')
			expect(content).not.toContain('java.util.Objects.toString(this.secretKey')
		},
	})
})
