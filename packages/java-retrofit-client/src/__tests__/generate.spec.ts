import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'
import { prepare, DEFAULT_CONFIG } from './common'
import path from 'path'
import { globSync } from 'glob'

const basePath = path.join(__dirname, '..', '..', '..', '..', '__tests__', 'specs')
const files = globSync('**/*.{yml,yaml}', { cwd: basePath })

const VARIANTS: { name: string; config: Record<string, unknown> }[] = [
	{ name: 'javax', config: {} },
	{ name: 'jakarta', config: { useJakarta: true } },
	{ name: 'javax-lombok', config: { useLombok: true } },
	{ name: 'javax-no-params', config: { apiParamsPackage: null } },
]

for (const variant of VARIANTS) {
	describe(`generate test cases (${variant.name})`, () => {
		for (const file of files) {
			test(file, async() => {
				const result = await prepare(path.join(basePath, file), {
					...DEFAULT_CONFIG,
					includeTests: true,
					...variant.config,
				})
				await testGenerate(result, { testName: `${variant.name}/${file}` })
			})
		}
	})
}
