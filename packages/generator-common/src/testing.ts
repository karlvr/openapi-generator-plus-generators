import { CodegenResult } from '@openapi-generator-plus/testing'
import { promises as fs } from 'fs'
import path from 'path'
import { tmpdir } from 'os'
import { cwd } from 'process'
import rimraf from 'rimraf'

function rimrafPromise(path: string, options?: rimraf.Options): Promise<void> {
	return new Promise(function(resolve, reject) {
		rimraf(path, options || {}, function(error) {
			if (error) {
				reject(error)
			} else {
				resolve()
			}
		})
	})
}

/**
 * A function to handle a test generation.
 * @param basePath the path in which the output was generated
 */
export type TestGenerateFunc = (basePath: string) => Promise<void>

/**
 * Generate the templates for the `CodegenResult` and call `func` to test them.
 * @param result a `CodegenResult` from `createCodegenResult`
 * @param func a function to handle the generation result
 * @param testName the name of the test
 */
export async function testGenerate(result: CodegenResult, func: TestGenerateFunc, testName: string): Promise<void> {
	const outputPath = path.join(tmpdir(), 'openapi-generator-plus-generators', path.basename(cwd()), testName)

	/* Clean the output first */
	await rimrafPromise(outputPath, { disableGlob: true })
	await fs.mkdir(outputPath, { recursive: true })

	await result.state.generator.exportTemplates(outputPath, result.doc)
	await func(outputPath)
}
