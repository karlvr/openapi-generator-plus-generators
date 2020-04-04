import path from 'path'
import { CodegenState, CodegenDocument } from '@openapi-generator-plus/types'
import createGenerator from '../index'
import { CodegenOptionsJava } from '../types'
import { constructGenerator, createCodegenState, createCodegenDocument, createCodegenInput } from '@openapi-generator-plus/core'

export interface TestResult {
	result: CodegenDocument
	state: CodegenState<CodegenOptionsJava>
}

export async function createTestResult(inputPath: string): Promise<TestResult> {
	const generator = constructGenerator(createGenerator)
	const state = createCodegenState({}, generator)
	const input = await createCodegenInput(path.resolve(__dirname, inputPath))
	const result = createCodegenDocument(input, state)
	return {
		result,
		state,
	}
}
