import less from 'less'
import { promises as fs } from 'fs'
import path from 'path'

export async function emit(filename: string, outputPath: string) {
	const lessOptions: Less.Options = {
		filename,
	}

	const templateSource = await fs.readFile(filename, { encoding: 'utf-8' })
	const result = await less.render(templateSource as string, lessOptions)

	await fs.mkdir(path.dirname(outputPath), { recursive: true })
	await fs.writeFile(outputPath, result.css, { encoding: 'utf-8' })
}
