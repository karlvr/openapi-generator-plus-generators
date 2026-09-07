import { runConformanceTests } from '@openapi-generator-plus/client-conformance/dist/testing'
import createGenerator from '..'
import { DEFAULT_CONFIG } from './common'

runConformanceTests({
	createGenerator,
	driver: 'java-retrofit',
	config: DEFAULT_CONFIG,
})
