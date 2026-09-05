import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'
import { promises as fs } from 'fs'
import path from 'path'
import { prepare, DEFAULT_CONFIG } from './common'

test('multipart form data omits the Content-Type header', async() => {
	const specPath = path.join(__dirname, '..', '..', '..', '..', '__tests__', 'specs', 'multipart.yml')
	const result = await prepare(specPath, DEFAULT_CONFIG)

	let apiContent = ''
	await testGenerate(result, {
		testName: 'multipart-content-type',
		postProcess: async(basePath) => {
			apiContent = await fs.readFile(path.join(basePath, 'src', 'api.ts'), 'utf-8')
		},
	})

	/*
	 * A multipart/form-data body is a FormData, and the runtime derives the Content-Type
	 * from it, including the boundary parameter. An explicit header suppresses that and
	 * loses the boundary, so a multipart parser rejects the request.
	 */
	expect(apiContent).not.toContain('localVarHeaderParameter.set(\'Content-Type\', \'multipart/form-data\');')

	/* The bodies are still built, so the header is missing rather than the whole operation. */
	expect(apiContent.match(/new FormData\(\)/g)).toHaveLength(13)

	/*
	 * The other multipart media types keep their header. The runtime would otherwise send
	 * multipart/form-data, which is not the media type the operation declares.
	 */
	expect(apiContent.match(/localVarHeaderParameter\.set\('Content-Type', 'multipart\/mixed'\);/g)).toHaveLength(1)
}, 20000)
