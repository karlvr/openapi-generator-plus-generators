import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'
import { compile, compileStrict, prepare, DEFAULT_CONFIG } from './common'
import path from 'path'
import { globSync } from 'glob'

describe('compile test cases', () => {
	const basePath = path.join(__dirname, '..', '..', '..', '..', '__tests__', 'specs')
	const files = globSync('**/*.{yml,yaml}', { cwd: basePath })

	for (const file of files) {
		test(file, async() => {
			const result = await prepare(path.join(basePath, file), {
				...DEFAULT_CONFIG,
				includeTests: true,
			})
			await testGenerate(result, {
				postProcess: async(basePath) => {
					await compile(basePath)
					await compileStrict(basePath)
				},
				testName: file,
			})
		})
	}

	test('parameters.yml with blind-date, ESM and without polyfills', async() => {
		const result = await prepare(path.join(basePath, 'parameters.yml'), {
			...DEFAULT_CONFIG,
			dateApproach: 'blind-date',
			esm: true,
			includePolyfills: false,
		})
		await testGenerate(result, {
			postProcess: async(basePath) => {
				await compile(basePath)
				await compileStrict(basePath)
			},
			testName: 'parameters-blind-date-esm',
		})
	})
})
