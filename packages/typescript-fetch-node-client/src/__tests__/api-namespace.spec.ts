import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'
import { promises as fs } from 'fs'
import path from 'path'
import { prepare, DEFAULT_CONFIG } from './common'

test('apiNamespace config', async() => {
	const result = await prepare('shadowed-model-v2.yml', {
		...DEFAULT_CONFIG,
		apiNamespace: 'ApiCustom',
	})

	let modelsContent = ''
	await testGenerate(result, {
		testName: 'api-namespace',
		postProcess: async(basePath) => {
			modelsContent = await fs.readFile(path.join(basePath, 'src', 'models.ts'), 'utf-8')
		},
	})

	expect(modelsContent).toContain('export namespace ApiCustom {')
	expect(modelsContent).not.toContain('export namespace Api {')
}, 20000)
