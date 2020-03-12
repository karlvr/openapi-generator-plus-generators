import { promises as fs } from 'fs'
import path from 'path'

export async function copyContents(dirPath: string, outputPath: string) {
	const files = await fs.readdir(dirPath)

	await fs.mkdir(outputPath, { recursive: true })

	for (const file of files) {
		const resolvedFile = path.resolve(dirPath, file)
		const stat = await fs.stat(resolvedFile)
		if (stat.isDirectory()) {
			await copyContents(resolvedFile, path.resolve(outputPath, file))
			continue
		}

		await fs.copyFile(resolvedFile, path.resolve(outputPath, file))
	}
}
