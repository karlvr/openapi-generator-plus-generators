import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'
import { promises as fs } from 'fs'
import path from 'path'
import { prepare, DEFAULT_CONFIG } from './common'

test('accept header', async() => {
	const result = await prepare('accept.yml', DEFAULT_CONFIG)

	let apiContent = ''
	await testGenerate(result, {
		testName: 'accept',
		postProcess: async(basePath) => {
			const apiPath = path.join(basePath, 'src', 'api')
			const files = await fs.readdir(apiPath)
			const contents = await Promise.all(files.map(file => fs.readFile(path.join(apiPath, file), 'utf-8')))
			apiContent = contents.join('\n')
		},
	})

	/*
	 * The header lists only the default response's parseable media types. listThings declares
	 * JSON and XML for its 200 and plain text for its 400. The client cannot parse the XML, and
	 * the 400 is not the default response, so only the JSON survives. customAccept declares JSON
	 * too, so two of the four operations get the header.
	 */
	expect(apiContent.match(/if \(!localVarHeaderParameter\.has\('Accept'\)\) \{/g)).toHaveLength(2)
	expect(apiContent.match(/localVarHeaderParameter\.set\('Accept', 'application\/json'\);/g)).toHaveLength(2)

	/* deleteThing declares no content, and thingsReport declares only CSV with an array schema. */
	expect(apiContent).not.toMatch(/'Accept', '[^']*(?:text\/csv|text\/plain|application\/xml)/)

	/*
	 * customAccept declares an Accept header parameter. Its parameter is appended before the
	 * default, and the default only applies when no value is present, so a caller-supplied
	 * value wins.
	 */
	const start = apiContent.indexOf('export function customAcceptParamCreator(')
	expect(start).toBeGreaterThan(-1)
	const paramCreator = apiContent.substring(start, apiContent.indexOf('localVarRequestOptions.headers', start))
	expect(paramCreator).toContain('localVarHeaderParameter.append(\'Accept\', String(accept));')
	expect(paramCreator.indexOf('.append(\'Accept\'')).toBeLessThan(paramCreator.indexOf('.has(\'Accept\')'))
}, 20000)
