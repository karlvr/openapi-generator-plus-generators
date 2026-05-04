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

test('pojo with useLombok uses @EqualsAndHashCode annotation instead of manual equals/hashCode', async() => {
	const result = await createCodegenResult(path.resolve(__dirname, 'pojo-equals.yml'), {
		...DEFAULT_CONFIG,
		useLombok: true,
	}, myCreateGenerator)
	await testGenerate(result, {
		testName: 'pojo-equals/lombok',
		postProcess: async(basePath) => {
			const content = await fs.promises.readFile(path.join(basePath, MODEL_PATH, 'FileData.java'), 'utf-8')
			expect(content).toContain('@lombok.EqualsAndHashCode')
			expect(content).not.toContain('public boolean equals(')
			expect(content).not.toContain('public int hashCode(')
		},
	})
})

test('pojo with binary property uses Arrays.equals in equals method', async() => {
	const result = await createCodegenResult(path.resolve(__dirname, 'pojo-equals.yml'), DEFAULT_CONFIG, myCreateGenerator)
	await testGenerate(result, {
		testName: 'pojo-equals/binary',
		postProcess: async(basePath) => {
			const content = await fs.promises.readFile(path.join(basePath, MODEL_PATH, 'FileData.java'), 'utf-8')
			expect(content).toContain('public boolean equals(')
			expect(content).toContain('public int hashCode(')
			expect(content).not.toContain('@lombok.EqualsAndHashCode')
			expect(content).toContain('java.util.Arrays.equals(this.content,')
			expect(content).not.toContain('java.util.Objects.equals(this.content,')
			expect(content).toContain('java.util.Arrays.equals(this.checksum,')
			expect(content).not.toContain('java.util.Objects.equals(this.checksum,')
			expect(content).toContain('java.util.Objects.equals(this.name,')
			expect(content).not.toContain('java.util.Arrays.equals(this.name,')
		},
	})
})

test('pojo with binary property using non-array native type uses Objects.equals in equals method', async() => {
	const result = await createCodegenResult(path.resolve(__dirname, 'pojo-equals.yml'), {
		...DEFAULT_CONFIG,
		binaryRepresentation: 'java.nio.ByteBuffer',
	}, myCreateGenerator)
	await testGenerate(result, {
		testName: 'pojo-equals/binary-non-array',
		postProcess: async(basePath) => {
			const content = await fs.promises.readFile(path.join(basePath, MODEL_PATH, 'FileData.java'), 'utf-8')
			expect(content).toContain('public boolean equals(')
			expect(content).toContain('java.util.Objects.equals(this.content,')
			expect(content).not.toContain('java.util.Arrays.equals(this.content,')
			expect(content).toContain('java.util.Arrays.equals(this.checksum,')
			expect(content).not.toContain('java.util.Objects.equals(this.checksum,')
		},
	})
})
