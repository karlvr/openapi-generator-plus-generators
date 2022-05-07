import { createCodegenResult, idx } from '@openapi-generator-plus/testing'
import path from 'path'
import createGenerator from '..'
import { CodegenGeneratorConstructor, CodegenGeneratorType } from '@openapi-generator-plus/types'

const myCreateGenerator: CodegenGeneratorConstructor = (config, context) => ({
	...createGenerator(config, context),
	generatorType: () => CodegenGeneratorType.SERVER,
})

test('array component with primitive type', async() => {
	const { doc } = await createCodegenResult(path.resolve(__dirname, 'component-types-v2.yml'), {}, myCreateGenerator)

	const group1 = doc.groups[0]
	const op1 = group1.operations[0]

	const op1AllParams = idx.allValues(op1.parameters!)
	const param1 = op1AllParams[0]
	expect(param1.nativeType.toString()).toEqual('java.util.List<java.lang.Integer>')
	expect(param1.nativeType.concreteType).toEqual('java.util.ArrayList<java.lang.Integer>')
})

/**
 * A concrete array type as a component doesn't use its concrete type, it uses its normal type, as Java doesn't
 * like `List<List<String>> list = new ArrayList<ArrayList<String>>();` it wants `new ArrayList<List<String>>();`
 */
test('array component with array concrete type', async() => {
	const { doc } = await createCodegenResult(path.resolve(__dirname, 'component-types-array-v2.yml'), {}, myCreateGenerator)

	const group1 = doc.groups[0]
	const op1 = group1.operations[0]

	const op1AllParams = idx.allValues(op1.parameters!)
	const param1 = op1AllParams[0]
	expect(param1.nativeType.toString()).toEqual('java.util.List<java.util.List<java.lang.String>>')
	expect(param1.nativeType.concreteType).toEqual('java.util.ArrayList<java.util.List<java.lang.String>>')
})
