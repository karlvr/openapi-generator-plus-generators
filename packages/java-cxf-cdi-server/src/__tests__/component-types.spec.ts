import { createTestState } from './common'
import { processDocument } from '@openapi-generator-plus/core'

test('array component with primitive type', async() => {
	const state = await createTestState('component-types-v2.yml')
	const result = processDocument(state)

	const group1 = result.groups[0]
	const op1 = group1.operations[0]

	const param1 = op1.allParams![0]
	expect(param1.nativeType.toString()).toEqual('java.util.List<java.lang.Integer>')
})
