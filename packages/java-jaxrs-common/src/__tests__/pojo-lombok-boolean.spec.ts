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

test('pojo with boolean property starting with “is” uses correct setter method name in Lombok mode', async() => {
	const result = await createCodegenResult(path.resolve(__dirname, 'pojo-lombok-boolean.yml'), {
		...DEFAULT_CONFIG,
		useLombok: true,
	}, myCreateGenerator)
	await testGenerate(result, {
		testName: 'pojo-equals/boolean-with-is-prefix',
		postProcess: async(basePath) => {
			const content = await fs.promises.readFile(path.join(basePath, MODEL_PATH, 'FileData.java'), 'utf-8')
			expect(content).toContain('setImage(isImage)')
			expect(content).not.toContain('setIsImage(isImage)')
			expect(content).toContain('setIsomorphic(isomorphic)')
			expect(content).toContain('setPasswordProtect(passwordProtect)')
			expect(content).not.toContain('setPasswordProtect(isPasswordProtect)')
			expect(content).not.toContain('setIsPasswordProtect(passwordProtect)')
			expect(content).not.toContain('setIsPasswordProtect(isPasswordProtect)')
		},
	})
})
