import less from 'less'
import { promises as fs } from 'fs'
import path from 'path'

export async function emit(fileName: string, outputPath: string) {
	const resolvedFileName = path.resolve(__dirname, '../less', fileName)
	const lessOptions: Less.Options = {
		filename: resolvedFileName,
	}

	const templateSource = await fs.readFile(resolvedFileName, 'UTF-8')
	const result = await less.render(templateSource as string, lessOptions)

	await fs.mkdir(path.dirname(outputPath), { recursive: true })
	await fs.writeFile(outputPath, result.css, 'UTF-8')
}
