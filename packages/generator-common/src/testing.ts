import { CodegenResult } from '@openapi-generator-plus/testing'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
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
 * @param outputPath if specified, generate to the given output path instead of a temp path (must be under cwd)
 */
export async function testGenerate(result: CodegenResult, func: TestGenerateFunc, outputPath?: string): Promise<void> {
	let tmpdir: string | undefined
	let deleteOutput = false
	if (outputPath) {
		outputPath = path.resolve(outputPath)
		if (!outputPath.startsWith(process.cwd())) {
			throw new Error(`Invalid output path: ${outputPath} not under cwd ${process.cwd()}`)
		}

		/* Clean the output first */
		await rimrafPromise(outputPath, { disableGlob: true })
		await fs.mkdir(outputPath, { recursive: true })

		tmpdir = undefined
	} else {
		tmpdir = await fs.mkdtemp(path.join(os.tmpdir(), 'openapi-generator-plus'))
		outputPath = tmpdir
		deleteOutput = true
	}

	try {
		await result.state.generator.exportTemplates(outputPath, result.doc)
		await func(outputPath)
	} finally {
		if (tmpdir && deleteOutput) {
			await rimrafPromise(tmpdir, { disableGlob: true })
		}
	}
}
