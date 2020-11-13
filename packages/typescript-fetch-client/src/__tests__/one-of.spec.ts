import { createCodegenResult } from '@openapi-generator-plus/testing'
import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'
import path from 'path'
import createGenerator from '..'
import { compile } from './common'

test('one of no discriminator', async() => {
	const result = await createCodegenResult(path.resolve(__dirname, 'one-of/one-of-no-discriminator.yml'), { legacyUnnamespacedModelSupport: true }, createGenerator)

	await testGenerate(result, compile, "test-output")
}, 20000)
