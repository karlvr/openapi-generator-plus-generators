import Maven from 'maven'

export async function compile(basePath: string): Promise<void> {
	const mvn = Maven.create({
		cwd: basePath,
		quiet: true,
	})
	await mvn.execute('compile')
}
