import { prepare, compile } from './common'
import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'

test('one of discriminator', async() => {
	const result = await prepare('one-of/one-of-discriminator.yml')
	await testGenerate(result, compile, 'output/one-of/discriminator')
})

test('one of subclasses discriminator', async() => {
	const result = await prepare('one-of/one-of-subclasses-discriminator.yml')
	await testGenerate(result, compile, 'output/one-of/subclasses-discriminator')
})
