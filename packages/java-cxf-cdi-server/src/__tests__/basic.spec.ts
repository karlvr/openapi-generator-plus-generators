import { createCodegenResult } from '@openapi-generator-plus/core/dist/testing'
import path from 'path'
import createGenerator from '..'

import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'
import { compile } from './common'

test('operations', async() => {
	const result = await createCodegenResult(path.resolve(__dirname, 'basic/operations-v2.yml'), {
		maven: {},
	}, createGenerator)

	await testGenerate(result, compile)
}, 20000)
