import { createCodegenResult } from '@openapi-generator-plus/core/dist/testing'
import * as idx from '@openapi-generator-plus/core/dist/indexed-type'
import path from 'path'
import createGenerator from '..'
import { CodegenGeneratorConstructor, CodegenGeneratorType } from '@openapi-generator-plus/types'
import { CodegenOptionsJava } from '../types'

const myCreateGenerator: CodegenGeneratorConstructor<CodegenOptionsJava> = (context) => ({
	...createGenerator(context),
	generatorType: () => CodegenGeneratorType.SERVER,
})

test('invalid identifiers', async() => {
	const { doc } = await createCodegenResult(path.resolve(__dirname, 'identifiers/invalid-identifiers.yml'), {}, myCreateGenerator)
	expect(doc).not.toBeUndefined()

	const NumericProperties = idx.get(doc.models, 'NumericProperties')
	expect(NumericProperties).not.toBeUndefined()
	expect(NumericProperties!.properties).not.toBeUndefined()
	expect(idx.get(NumericProperties!.properties!, '1')).not.toBeUndefined()
	expect(idx.get(NumericProperties!.properties!, '1')!.type).toEqual('string')
	// expect(idx.get(NumericProperties!.properties!, '1')!.name).toEqual('_1') // TODO we currently rely on templates to make properties identifier-safe

	const NumericEnum = idx.get(doc.models, 'NumericEnum')
	expect(NumericEnum).not.toBeUndefined()
	expect(NumericEnum!.enumValues).not.toBeUndefined()
	expect(idx.get(NumericEnum!.enumValues!, '2')!.value).toEqual('2')
	expect(idx.get(NumericEnum!.enumValues!, '2')!.name).toEqual('_2')
})
