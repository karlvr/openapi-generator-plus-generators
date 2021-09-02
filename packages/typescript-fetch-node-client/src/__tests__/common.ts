import path from 'path'
import { CodegenConfig } from '@openapi-generator-plus/types'
import { CodegenResult, createCodegenResult } from '@openapi-generator-plus/testing'
import createGenerator from '..'
import { exec } from 'child_process'

export const DEFAULT_CONFIG: CodegenConfig = {
	npm: {},
}

export async function prepare(spec: string, config?: CodegenConfig): Promise<CodegenResult> {
	return createCodegenResult(path.resolve(__dirname, spec), config || DEFAULT_CONFIG, createGenerator)
}

export async function compile(basePath: string): Promise<void> {
	return new Promise(function(resolve, reject) {
		exec(
			'npm install', 
			{
				cwd: basePath,
			},
			function(error, stdout, stderr) {
				if (error) {
					reject(new Error(`${error.cmd || '<unknown>'} exited with code ${error.code || 'unknown'}:\n ${stdout || stderr}`))
				} else {
					resolve()
				}
			}
		)
	})
}
