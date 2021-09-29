import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'
import { compile, DEFAULT_CONFIG, prepare } from './common'

test('one of no discriminator', async() => {
	const result = await prepare('one-of/one-of-no-discriminator.yml', {
		...DEFAULT_CONFIG,
		legacyUnnamespacedModelSupport: true,
	})

	await testGenerate(result, { postProcess: compile, testName: 'one-of' })
}, 20000)
