import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'
import { compile, prepare } from './common'

test('operations', async() => {
	const result = await prepare('basic/operations-v2.yml')

	await testGenerate(result, compile)
}, 20000)
