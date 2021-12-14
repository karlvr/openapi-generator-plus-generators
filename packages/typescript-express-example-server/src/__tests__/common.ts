import path from 'path'
import { CodegenConfig } from '@openapi-generator-plus/types'
import { CodegenResult, createCodegenResult } from '@openapi-generator-plus/testing'
import createGenerator from '..'
import { execSync } from 'child_process'

export const DEFAULT_CONFIG: CodegenConfig = {
	npm: {
		name: 'test',
	},
}

export async function prepare(spec: string, config?: CodegenConfig): Promise<CodegenResult> {
	return createCodegenResult(path.resolve(__dirname, spec), config || DEFAULT_CONFIG, createGenerator)
}

export async function compile(basePath: string): Promise<void> {
	execSync('pnpm install', {
		cwd: basePath,
	})
	execSync('pnpm build', {
		cwd: basePath,
	})
}
