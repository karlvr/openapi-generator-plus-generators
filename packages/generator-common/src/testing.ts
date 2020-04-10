import { CodegenResult } from '@openapi-generator-plus/core/dist/testing'
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
 * 
 * @param result a `CodegenResult` from `createCodegenResult`
 * @param func a function to handle the generation result
 */
export async function testGenerate<O>(result: CodegenResult<O>, func: TestGenerateFunc) {
	const tmpdir = await fs.mkdtemp(path.join(os.tmpdir(), 'openapi-generator-plus'))
	try {
		await result.state.generator.exportTemplates(tmpdir, result.doc, result.state)
		await func(tmpdir)
	} finally {
		await rimrafPromise(tmpdir, { disableGlob: true })
	}
}
