import { createCodegenResult } from '@openapi-generator-plus/core/dist/testing'
import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'
import path from 'path'
import createGenerator from '..'
import { compile } from './common'

test('shadowed model', async() => {
	const result = await createCodegenResult(path.resolve(__dirname, 'shadowed-model-v2.yml'), {}, createGenerator)

	await testGenerate(result, compile)
}, 20000)
