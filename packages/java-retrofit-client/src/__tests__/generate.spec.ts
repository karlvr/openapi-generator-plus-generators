import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'
import { RETROFIT_UNSUPPORTED_BODY_MESSAGE } from '..'
import { prepare, DEFAULT_CONFIG } from './common'
import fs from 'fs'
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

/**
 * Report whether a specification declares a request body encoding that this generator does
 * not render.
 *
 * Retrofit encodes a multipart body and a form body with its own annotations, one per
 * property. This generator writes neither, so it refuses such a specification.
 */
function declaresUnsupportedBody(file: string): boolean {
	const content = fs.readFileSync(path.join(basePath, file), 'utf-8')
	return content.includes('multipart/form-data') || content.includes('application/x-www-form-urlencoded')
}

for (const variant of VARIANTS) {
	describe(`generate test cases (${variant.name})`, () => {
		for (const file of files) {
			const refused = declaresUnsupportedBody(file)

			test(file, async() => {
				const generate = async() => {
					const result = await prepare(path.join(basePath, file), {
						...DEFAULT_CONFIG,
						includeTests: true,
						...variant.config,
					})
					await testGenerate(result, { testName: `${variant.name}/${file}` })
				}

				if (refused) {
					await expect(generate()).rejects.toThrow(RETROFIT_UNSUPPORTED_BODY_MESSAGE)
				} else {
					await generate()
				}
			})
		}
	})
}
