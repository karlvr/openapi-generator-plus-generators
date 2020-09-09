import Maven from 'maven'
import { createCodegenResult, CodegenResult } from '@openapi-generator-plus/testing'
import createGenerator from '..'
import path from 'path'
import { CodegenOptionsJavaServer } from '@openapi-generator-plus/java-jaxrs-server-generator'
import { CodegenConfig } from '@openapi-generator-plus/types'

export const DEFAULT_CONFIG: CodegenConfig = {
	maven: {},
}

export async function prepare(spec: string, config?: CodegenConfig): Promise<CodegenResult<CodegenOptionsJavaServer>> {
	return createCodegenResult(path.resolve(__dirname, spec), config || DEFAULT_CONFIG, createGenerator)
}

export async function compile(basePath: string): Promise<void> {
	const mvn = Maven.create({
		cwd: basePath,
		quiet: true,
	})
	await mvn.execute('compile')
}

export async function compileTest(basePath: string): Promise<void> {
	const mvn = Maven.create({
		cwd: basePath,
		quiet: true,
	})
	await mvn.execute('test')
}
