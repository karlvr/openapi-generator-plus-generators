import { createCodegenResult } from '@openapi-generator-plus/testing'
import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'
import path from 'path'
import createGenerator from '..'
import { compile, DEFAULT_CONFIG } from './common'

test('shadowed model', async() => {
	const result = await createCodegenResult(path.resolve(__dirname, 'shadowed-model-v2.yml'), DEFAULT_CONFIG, createGenerator)

	await testGenerate(result, compile, 'shadowed-model')
}, 20000)
