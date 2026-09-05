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
			apiContent = await fs.readFile(path.join(basePath, 'src', 'main', 'java', 'com', 'example', 'ThingsApi.java'), 'utf-8')
		},
	})

	/*
	 * The header lists the default response's media types, unfiltered. listThings declares JSON
	 * and XML for its 200 and plain text for its 400. Only the 200 is the default response, so
	 * the header carries both of its media types and not the plain text.
	 */
	expect(apiContent).toContain('@retrofit2.http.Headers({ "Accept: application/json, application/xml" })')

	/* thingsReport declares CSV, which no parseability filter removes here. */
	expect(apiContent).toContain('@retrofit2.http.Headers({ "Accept: text/csv" })')

	/* deleteThing declares no content, and customAccept declares an Accept header parameter. */
	expect(apiContent.match(/@retrofit2\.http\.Headers/g)).toHaveLength(2)
	expect(apiContent).toMatch(/@retrofit2\.http\.Header\("[Aa]ccept"\)/)
}, 20000)
