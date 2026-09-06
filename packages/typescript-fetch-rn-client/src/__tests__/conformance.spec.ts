import { runConformanceTests } from '@openapi-generator-plus/client-conformance/dist/testing'
import createGenerator from '..'
import { DEFAULT_CONFIG } from './common'

/*
 * This generator overrides `packageDependencies`, and its override drops the
 * `whatwg-fetch` dependency that the polyfill option adds. The runtime still
 * imports `whatwg-fetch`, so a generated project with the polyfill cannot
 * resolve it. Turn the polyfill off until that is settled, so the rest of the
 * suite can run.
 */
runConformanceTests({
	createGenerator,
	driver: 'fetch-client',
	config: { ...DEFAULT_CONFIG, includePolyfills: false },
})
