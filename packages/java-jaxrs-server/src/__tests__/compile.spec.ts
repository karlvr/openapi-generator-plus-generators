import { CONFORMANCE_SPEC } from '@openapi-generator-plus/client-conformance/dist/testing'
import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'
import Maven from 'maven'
import path from 'path'
import { DEFAULT_CONFIG, prepare } from './common'

/*
 * `generate.spec` renders the templates for every specification, but never compiles the
 * result. This compiles one, so the suite covers the dependencies that the generated
 * `pom.xml` declares, and the packages that the generated classes name.
 *
 * Each variant uses the widest specification that it can express. JAX-RS 2.1 declares no
 * multipart API, so the javax variant uses a specification without a multipart request body.
 */
const ENCODING_SPEC = path.join(__dirname, '..', '..', '..', '..', '__tests__', 'specs', 'encoding.yml')

const VARIANTS: { name: string; spec: string; config: Record<string, unknown> }[] = [
	{ name: 'javax', spec: ENCODING_SPEC, config: {} },
	{ name: 'jakarta', spec: CONFORMANCE_SPEC, config: { useJakarta: true } },
]

for (const variant of VARIANTS) {
	test(`the generated project compiles (${variant.name})`, async() => {
		const result = await prepare(variant.spec, { ...DEFAULT_CONFIG, ...variant.config })

		await testGenerate(result, {
			testName: `compile/${variant.name}`,
			postProcess: async(basePath) => {
				const mvn = Maven.create({ cwd: basePath, quiet: true })
				await mvn.execute('compile')
			},
		})
	})
}
