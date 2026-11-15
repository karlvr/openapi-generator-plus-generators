import path from 'path'
import { CodegenConfig } from '@openapi-generator-plus/types'
import { CodegenResult, createCodegenResult } from '@openapi-generator-plus/testing'
import createGenerator from '..'
import { exec } from 'child_process'
import { promises as fs } from 'fs'

export const DEFAULT_CONFIG: CodegenConfig = {
	npm: {},
}

export async function prepare(spec: string, config?: CodegenConfig): Promise<CodegenResult> {
	return createCodegenResult(path.resolve(__dirname, spec), config || DEFAULT_CONFIG, createGenerator)
}

export async function compile(basePath: string): Promise<void> {
	return new Promise(function(resolve, reject) {
		exec(
			'pnpm install', 
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

/**
 * The settings of a strict TypeScript project that compiles the generated code without the DOM
 * library: a bundler or a runtime that strips types, such as a Cloudflare Worker or Node.
 */
const STRICT_TSCONFIG = {
	compilerOptions: {
		target: 'es2022',
		module: 'preserve',
		moduleResolution: 'bundler',
		lib: ['es2022'],
		types: ['node'],
		strict: true,
		noUncheckedIndexedAccess: true,
		noImplicitOverride: true,
		noImplicitReturns: true,
		noFallthroughCasesInSwitch: true,
		verbatimModuleSyntax: true,
		isolatedModules: true,
		erasableSyntaxOnly: true,
		skipLibCheck: true,
		noEmit: true,
	},
	include: ['src'],
}

/**
 * Compiles the generated code with strict settings and without the DOM library. Run it after
 * {@link compile}, which installs TypeScript.
 */
export async function compileStrict(basePath: string): Promise<void> {
	await fs.writeFile(path.join(basePath, 'tsconfig.strict.json'), JSON.stringify(STRICT_TSCONFIG, null, '\t'))
	return new Promise(function(resolve, reject) {
		exec(
			'pnpm exec tsc -p tsconfig.strict.json',
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
