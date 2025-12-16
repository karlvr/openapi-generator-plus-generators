import { createCodegenResult, idx } from '@openapi-generator-plus/testing'
import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'
import path from 'path'
import createGenerator from '..'

test('response with headers generates wrapper class info', async() => {
	const result = await createCodegenResult(path.resolve(__dirname, 'response-headers.yml'), {}, createGenerator)
	const { doc } = result

	expect(doc.groups.length).toBeGreaterThan(0)
	const group1 = doc.groups[0]
	expect(group1.operations.length).toBeGreaterThan(0)
	
	const getUserOp = group1.operations.find(op => {
		const defaultResponse = op.defaultResponse
		return defaultResponse && defaultResponse.defaultContent && (defaultResponse.defaultContent as any).wrapperName
	})
	expect(getUserOp).toBeDefined()
	
	if (!getUserOp) return

	const defaultResponse = getUserOp.defaultResponse
	expect(defaultResponse).toBeDefined()
	if (!defaultResponse) return

	expect(defaultResponse.defaultContent).toBeDefined()
	if (!defaultResponse.defaultContent) return

	const wrapperName = (defaultResponse.defaultContent as any).wrapperName
	expect(wrapperName).toBeDefined()
	expect(typeof wrapperName).toBe('string')
	expect(wrapperName).toContain('ResponseWrapper')
	
	expect(defaultResponse.defaultContent.nativeType?.nativeType).toBeDefined()
	expect(defaultResponse.defaultContent.nativeType?.nativeType).toContain('ResponseWrapper')
	
	const wrapperHeaders = (defaultResponse.defaultContent as any).wrapperHeaders
	expect(wrapperHeaders).toBeDefined()
	expect(Array.isArray(wrapperHeaders)).toBe(true)
	expect(wrapperHeaders.length).toBeGreaterThan(0)
	
	const wrapperBodyType = (defaultResponse.defaultContent as any).wrapperBodyType
	expect(wrapperBodyType).toBeDefined()
})

test('operations have multiple responses for header testing', async() => {
	const result = await createCodegenResult(path.resolve(__dirname, 'response-headers.yml'), {}, createGenerator)
	const { doc } = result

	expect(doc.groups.length).toBeGreaterThan(0)
	const group1 = doc.groups[0]
	expect(group1.operations.length).toBeGreaterThan(0)
	
	let hasResponses = false
	for (const op of group1.operations) {
		if (op.responses) {
			const allResponses = idx.allValues(op.responses)
			if (allResponses.length > 0) {
				hasResponses = true
				break
			}
		}
	}
	expect(hasResponses).toBe(true)
})

test('response wrapper class info is set for generation', async() => {
	const result = await createCodegenResult(path.resolve(__dirname, 'response-headers.yml'), {}, createGenerator)
	const { doc } = result

	const group1 = doc.groups[0]
	const opWithWrapper = group1.operations.find(op => {
		const defaultResponse = op.defaultResponse
		return defaultResponse && defaultResponse.defaultContent && (defaultResponse.defaultContent as any).wrapperName
	})
	expect(opWithWrapper).toBeDefined()
	
	if (!opWithWrapper) return
	
	const defaultResponse = opWithWrapper.defaultResponse
	expect(defaultResponse).toBeDefined()
	if (!defaultResponse || !defaultResponse.defaultContent) return
	
	const wrapperName = (defaultResponse.defaultContent as any).wrapperName
	expect(wrapperName).toBeDefined()
	expect(typeof wrapperName).toBe('string')
	expect((defaultResponse.defaultContent as any).wrapperHeaders).toBeDefined()
	expect((defaultResponse.defaultContent as any).wrapperBodyType).toBeDefined()
})

test('response with headers generates wrapper for listItems', async() => {
	const result = await createCodegenResult(path.resolve(__dirname, 'response-headers.yml'), {}, createGenerator)
	const { doc } = result

	const group1 = doc.groups[0]
	const listItemsOp = group1.operations.find(op => op.name === 'listItems')
	expect(listItemsOp).toBeDefined()
	
	if (!listItemsOp) return

	const defaultResponse = listItemsOp.defaultResponse
	expect(defaultResponse).toBeDefined()
	if (!defaultResponse) return

	expect(defaultResponse.defaultContent).toBeDefined()
	if (!defaultResponse.defaultContent) return

	const wrapperName = (defaultResponse.defaultContent as any).wrapperName
	expect(wrapperName).toBe('ListItems200ResponseWrapper')
})

