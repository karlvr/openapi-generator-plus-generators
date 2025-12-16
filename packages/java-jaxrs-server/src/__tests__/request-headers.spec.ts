import { createCodegenResult, idx } from '@openapi-generator-plus/testing'
import path from 'path'
import createGenerator from '..'

test('request headers are accessible via HttpHeaders parameter', async() => {
	const result = await createCodegenResult(path.resolve(__dirname, 'request-headers.yml'), {}, createGenerator)
	const { doc } = result

	expect(doc.groups.length).toBeGreaterThan(0)
	const group1 = doc.groups[0]
	expect(group1.operations.length).toBeGreaterThan(0)
	
	const getUserOp = group1.operations.find(op => op.name === 'getUser')
	expect(getUserOp).toBeDefined()
	
	if (!getUserOp) return

	// Verify that header parameters are present
	const headerParams = getUserOp.headerParams
	expect(headerParams).toBeDefined()
	if (headerParams) {
		const headerParamNames = Array.from(idx.values(headerParams)).map(p => p.name)
		expect(headerParamNames).toContain('X-Request-Id')
		expect(headerParamNames).toContain('X-Client-Version')
	}
})
