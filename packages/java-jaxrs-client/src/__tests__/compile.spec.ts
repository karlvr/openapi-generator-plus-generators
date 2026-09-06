import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'
import Maven from 'maven'
import path from 'path'
import { DEFAULT_CONFIG, prepare } from './common'

/*
 * `generate.spec` renders the templates for every specification, but never compiles the
 * result. This compiles one, so the suite covers the dependencies that the generated
 * `pom.xml` declares.
 *
 * The specification covers a parameter of each shape, and a model. It leaves out a
 * multipart request body, because this generator renders one with a CXF type that its
 * `pom.xml` does not declare.
 */
const SPEC = path.join(__dirname, '..', '..', '..', '..', '__tests__', 'specs', 'encoding.yml')
const VARIANTS: { name: string; config: Record<string, unknown> }[] = [
	{ name: 'javax', config: {} },
	{ name: 'jakarta', config: { useJakarta: true } },
]

for (const variant of VARIANTS) {
	test(`the generated project compiles (${variant.name})`, async() => {
		const result = await prepare(SPEC, { ...DEFAULT_CONFIG, ...variant.config })

		await testGenerate(result, {
			testName: `compile/${variant.name}`,
			postProcess: async(basePath) => {
				const mvn = Maven.create({ cwd: basePath, quiet: true })
				await mvn.execute('compile')
			},
		})
	})
}
