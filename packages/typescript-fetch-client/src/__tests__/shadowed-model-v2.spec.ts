import { createCodegenResult } from '@openapi-generator-plus/core/dist/testing'
import path from 'path'
import os from 'os'
import { promises as fs } from 'fs'
import createGenerator from '..'
import * as ts from 'typescript'
import rimraf from 'rimraf'
import glob from 'glob-promise'

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

async function compile(basePath: string): Promise<void> {
	const searchPath = path.join(basePath, '**/*.ts')
	const paths = await glob(searchPath)
	if (!paths.length) {
		throw new Error('No files found to compile')
	}
	const program = ts.createProgram(paths, {
		noEmitOnError: true,
		noImplicitAny: true,
		target: ts.ScriptTarget.ES2019,
		module: ts.ModuleKind.CommonJS,
		skipDefaultLibCheck: true,
		skipLibCheck: true,
		strict: true,
	})
	const result = program.emit()
	if (result.emitSkipped && result.diagnostics.length) {
		const diagnostics = result.diagnostics
			.map(d => `${d.file ? path.basename(d.file.fileName) : ''}:${d.file && d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start).line : '?'} ${d.messageText}`)
		throw new Error(`Failed to compile. ${result.diagnostics.length} diagnostics:\n  ${diagnostics.join('\n  ')}`)
	} else if (result.diagnostics.length) {
		for (const d of result.diagnostics) {
			console.warn(d.messageText)
		}
	}
}

test('shadowed model', async() => {
	const result = await createCodegenResult(path.resolve(__dirname, 'shadowed-model-v2.yml'), {}, createGenerator)

	const tmpdir = await fs.mkdtemp(path.join(os.tmpdir(), 'openapi-generator-plus'))
	try {
		await result.state.generator.exportTemplates(tmpdir, result.doc, result.state)
		await compile(tmpdir)
	} finally {
		await rimrafPromise(tmpdir, { disableGlob: true })
	}
}, 20000)
