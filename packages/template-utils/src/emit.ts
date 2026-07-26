import { promises as fs } from 'fs'
import path from 'path'
import { EOL } from 'os'

async function detectPreferredLineEnding(outputPath: string): Promise<string | undefined> {
	try {
		const existingFileString = await fs.readFile(outputPath, { encoding: 'utf-8' })
		const firstNewline = existingFileString.indexOf('\n')
		if (firstNewline > 0) {
			const beforeFirstNewline = existingFileString.charAt(firstNewline - 1)
			if (beforeFirstNewline === '\r') {
				return '\r\n'
			}
		}
		return '\n'
	} catch {
		return undefined
	}
}

/**
 * Emit `content` to `outputPath`, or to stdout if `outputPath` is `'-'`.
 *
 * - Line endings are normalised to either the existing file's line ending (if the
 *   file already exists) or the platform default.
 * - The output directory is created recursively if necessary.
 * - If `replace` is `false` and the file already exists, the call is a no-op.
 */
export async function emit(content: string, outputPath: string, replace: boolean): Promise<void> {
	if (outputPath === '-') {
		const normalised = content.replace(/\r\n/g, '\n').replace(/\n/g, EOL)
		// eslint-disable-next-line no-console
		console.log(normalised)
		return
	}

	const preferredLineEnding = await detectPreferredLineEnding(outputPath) || EOL
	const normalised = content.replace(/\r\n/g, '\n').replace(/\n/g, preferredLineEnding)

	if (!replace) {
		try {
			await fs.access(outputPath)
			/* File exists and we shouldn't replace it; nothing to do. */
			return
		} catch {
			/* Falls through to writing the file. */
		}
	}
	await fs.mkdir(path.dirname(outputPath), { recursive: true })
	await fs.writeFile(outputPath, normalised, { encoding: 'utf-8' })
}
