import type { CodegenResult } from '@openapi-generator-plus/testing'
import { promises as fs } from 'fs'
import path from 'path'
import { tmpdir } from 'os'
import { cwd } from 'process'
import { rimraf } from 'rimraf'

/**
 * A function to handle a test generation.
 * @param basePath the path in which the output was generated
 */
export type TestGeneratePostProcess = (basePath: string) => Promise<void>

export interface TestGenerateOptions {
	/**
	 * The name of the test
	 */
	testName: string
	/**
	 * A function to handle the generation result.
	 */
	postProcess?: TestGeneratePostProcess
	clean?: boolean
}

/**
 * Generate the templates for the `CodegenResult` and call `func` to test them.
 * @param result a `CodegenResult` from `createCodegenResult`
 * @param options options for the test
 */
export async function testGenerate(result: CodegenResult, options: TestGenerateOptions): Promise<void> {
	const { testName, postProcess, clean } = options

	const outputPath = path.join(tmpdir(), 'openapi-generator-plus-generators', path.basename(cwd()), testName)

	/* Clean the output first */
	if (clean !== false) {
		await rimraf(outputPath, { glob: false })
	}

	await fs.mkdir(outputPath, { recursive: true })

	await result.state.generator.exportTemplates(outputPath, result.doc)
	if (postProcess) {
		await postProcess(outputPath)
	}
}
