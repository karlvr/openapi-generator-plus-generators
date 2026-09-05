import { createCodegenResult, idx } from '@openapi-generator-plus/testing'
import path from 'path'
import createGenerator from '..'
import { CodegenConfig, CodegenEnumSchema, CodegenGeneratorConstructor, CodegenGeneratorType } from '@openapi-generator-plus/types'

const myCreateGenerator: CodegenGeneratorConstructor = (config, context) => ({
	...createGenerator(config, context),
	generatorType: () => CodegenGeneratorType.SERVER,
})

const specPath = path.resolve(__dirname, 'constant-style.yml')

/** Returns the generated names of the members of the `MyEnum` schema in the test specification. */
async function enumMemberNames(config: CodegenConfig): Promise<string[]> {
	const { doc } = await createCodegenResult(specPath, config, myCreateGenerator)
	const MyEnum = idx.get(doc.schemas, 'MyEnum') as CodegenEnumSchema
	return idx.allValues(MyEnum.enumValues!).map(value => value.name)
}

test('constantStyle defaults to allCapsSnake', async() => {
	expect(await enumMemberNames({})).toEqual(['MY_VALUE', 'ANOTHER_VALUE'])
})

test('constantStyle allCapsSnake', async() => {
	expect(await enumMemberNames({ constantStyle: 'allCapsSnake' })).toEqual(['MY_VALUE', 'ANOTHER_VALUE'])
})

test('constantStyle allCaps', async() => {
	expect(await enumMemberNames({ constantStyle: 'allCaps' })).toEqual(['MYVALUE', 'ANOTHERVALUE'])
})

test('constantStyle camelCase', async() => {
	expect(await enumMemberNames({ constantStyle: 'camelCase' })).toEqual(['myValue', 'anotherValue'])
})

test('constantStyle pascalCase', async() => {
	expect(await enumMemberNames({ constantStyle: 'pascalCase' })).toEqual(['MyValue', 'AnotherValue'])
})

test('constantStyle accepts the deprecated snake value', async() => {
	expect(await enumMemberNames({ constantStyle: 'snake' })).toEqual(['MY_VALUE', 'ANOTHER_VALUE'])
})

test('constantStyle rejects an invalid value', async() => {
	await expect(enumMemberNames({ constantStyle: 'allCapsSnakeCase' })).rejects.toThrow(/allCapsSnake, allCaps, camelCase, pascalCase/)
})

test('enumMemberStyle constant', async() => {
	expect(await enumMemberNames({ enumMemberStyle: 'constant' })).toEqual(['MY_VALUE', 'ANOTHER_VALUE'])
})

test('enumMemberStyle accepts the deprecated contant value', async() => {
	expect(await enumMemberNames({ enumMemberStyle: 'contant' })).toEqual(['MY_VALUE', 'ANOTHER_VALUE'])
})

test('enumMemberStyle preserve', async() => {
	expect(await enumMemberNames({ enumMemberStyle: 'preserve' })).toEqual(['my_value', 'another_value'])
})

test('enumMemberStyle rejects an invalid value', async() => {
	await expect(enumMemberNames({ enumMemberStyle: 'constants' })).rejects.toThrow(/preserve, constant/)
})
