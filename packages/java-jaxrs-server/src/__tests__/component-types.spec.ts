import { createCodegenResult } from '@openapi-generator-plus/core/dist/testing'
import * as idx from '@openapi-generator-plus/core/dist/indexed-type'
import path from 'path'
import createGenerator from '..'

test('array component with primitive type', async() => {
	const { doc } = await createCodegenResult(path.resolve(__dirname, 'component-types-v2.yml'), {}, createGenerator)

	const group1 = doc.groups[0]
	const op1 = group1.operations[0]

	const op1AllParams = idx.allValues(op1.parameters!)
	const param1 = op1AllParams[0]
	expect(param1.nativeType.toString()).toEqual('java.util.List<java.lang.Integer>')
})
