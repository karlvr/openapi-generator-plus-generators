import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'
import { compile, prepare } from './common'

test('one of no discriminator', async() => {
	const result = await prepare('one-of/one-of-no-discriminator.yml', { legacyUnnamespacedModelSupport: true })

	await testGenerate(result, compile, 'one-of')
}, 20000)
