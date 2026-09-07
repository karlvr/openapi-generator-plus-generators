import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'
import Maven from 'maven'
import path from 'path'
import { DEFAULT_CONFIG, prepare } from './common'

/*
 * `generate.spec` renders the templates for every specification, but never compiles the
 * result. These compile one specification of each shape, so the suite covers the dependencies
 * that the generated `pom.xml` declares, and the files that the generator emits.
 */
const SPECS_PATH = path.join(__dirname, '..', '..', '..', '..', '__tests__', 'specs')

/** A parameter of each shape, and a model. */
const ENCODING_SPEC = path.join(SPECS_PATH, 'encoding.yml')

/** A multipart request body of each shape, including part headers and part arrays. */
const MULTIPART_SPEC = path.join(SPECS_PATH, 'multipart.yml')

/** A form request body. */
const FORM_SPEC = path.join(SPECS_PATH, 'x-www-form-urlencoded.yml')

const SPECS: { name: string; spec: string }[] = [
	{ name: 'encoding', spec: ENCODING_SPEC },
	{ name: 'multipart', spec: MULTIPART_SPEC },
	{ name: 'form', spec: FORM_SPEC },
]

const VARIANTS: { name: string; config: Record<string, unknown> }[] = [
	{ name: 'javax', config: {} },
	{ name: 'jakarta', config: { useJakarta: true } },
	{ name: 'javax-bean-validation', config: { useBeanValidation: true } },
]

for (const variant of VARIANTS) {
	for (const one of SPECS) {
		test(`the generated project compiles (${variant.name}, ${one.name})`, async() => {
			const result = await prepare(one.spec, { ...DEFAULT_CONFIG, ...variant.config })

			await testGenerate(result, {
				testName: `compile/${variant.name}/${one.name}`,
				postProcess: async(basePath) => {
					const mvn = Maven.create({ cwd: basePath, quiet: true })
					await mvn.execute('compile')
				},
			})
		})
	}
}
