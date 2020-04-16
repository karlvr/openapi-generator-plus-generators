import { createCodegenResult } from '@openapi-generator-plus/core/dist/testing'
import path from 'path'
import createGenerator from '..'

test('array component with primitive type', async() => {
	const { doc } = await createCodegenResult(path.resolve(__dirname, 'component-types-v2.yml'), {}, createGenerator)

	const group1 = doc.groups[0]
	const op1 = group1.operations[0]

	const param1 = op1.parameters![0]
	expect(param1.nativeType.toString()).toEqual('java.util.List<java.lang.Integer>')
})
