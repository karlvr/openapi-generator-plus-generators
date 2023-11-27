import path from 'path'
import { CodegenConfig } from '@openapi-generator-plus/types'
import { CodegenResult, createCodegenResult } from '@openapi-generator-plus/testing'
import createGenerator from '..'

export const DEFAULT_CONFIG: CodegenConfig = {
	npm: {},
}

export async function prepare(spec: string, config?: CodegenConfig): Promise<CodegenResult> {
	return createCodegenResult(path.resolve(__dirname, spec), config || DEFAULT_CONFIG, createGenerator)
}
