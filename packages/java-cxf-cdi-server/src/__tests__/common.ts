import path from 'path'
import { CodegenState, CodegenConfig, CodegenDocument } from '@openapi-generator-plus/types'
import createGenerator from '../index'
import { CodegenOptionsJava } from '../types'
import { constructGenerator, createCodegenState, createCodegenDocument } from '@openapi-generator-plus/core'

export interface TestResult {
	result: CodegenDocument
	state: CodegenState<CodegenOptionsJava>
}

export async function createTestResult(inputPath: string): Promise<TestResult> {
	const generator = constructGenerator(createGenerator)
	const config: CodegenConfig = {
		inputPath: path.resolve(__dirname, inputPath),
		outputPath: 'TODO', // TODO
		generator: 'TODO', // TODO
	}
	const state = await createCodegenState(config, generator)
	const result = createCodegenDocument(state)
	return {
		result,
		state,
	}
}
