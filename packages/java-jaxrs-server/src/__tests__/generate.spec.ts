import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'
import { NO_MULTIPART_MESSAGE } from '@openapi-generator-plus/java-jaxrs-generator-common'
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
 * Report whether a specification declares a multipart request body.
 *
 * JAX-RS 2.1 declares no multipart API, so this generator refuses such a specification
 * unless the `useJakarta` option is set. Jakarta REST 3.1 declares `EntityPart`.
 */
function declaresMultipart(file: string): boolean {
	return fs.readFileSync(path.join(basePath, file), 'utf-8').includes('multipart/form-data')
}

for (const variant of VARIANTS) {
	describe(`generate test cases (${variant.name})`, () => {
		for (const file of files) {
			const refused = declaresMultipart(file) && !variant.config.useJakarta

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
					await expect(generate()).rejects.toThrow(NO_MULTIPART_MESSAGE)
				} else {
					await generate()
				}
			})
		}
	})
}
