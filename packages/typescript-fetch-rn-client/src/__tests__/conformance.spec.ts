import { runConformanceTests } from '@openapi-generator-plus/client-conformance/dist/testing'
import createGenerator from '..'
import { DEFAULT_CONFIG } from './common'

runConformanceTests({
	createGenerator,
	driver: 'fetch-client',
	config: DEFAULT_CONFIG,
})
