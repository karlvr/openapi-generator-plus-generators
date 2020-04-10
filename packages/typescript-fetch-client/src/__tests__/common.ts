import ts from 'typescript'
import glob from 'glob-promise'
import path from 'path'

export async function compile(basePath: string): Promise<void> {
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
