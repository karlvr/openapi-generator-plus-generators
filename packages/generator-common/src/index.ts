import { CodegenGenerator, CodegenServer } from '@openapi-generator-plus/types'
import { camelCase } from './case-transforms'
export * from './case-transforms'
export * from './http-methods'
import Url from 'url-parse'

import * as allGroupingStrategies from './operation-grouping'
export const GroupingStrategies = allGroupingStrategies

export function commonGenerator<O>(): Pick<CodegenGenerator<O>, 'toOperationName'> {
	return {

		/** Create a default operation name for operations that lack an operationId */
		toOperationName: (path: string, method: string): string => {
			/* Remove path variables from the path */
			const sanitisedPath = path.replace(/\{[^}]*\}/g, '')
			const combined = `${method.toLocaleLowerCase()}_${sanitisedPath}`
			const sanitizedCombined = combined.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+$/, '')
			return camelCase(sanitizedCombined)
		},

	}
}

export function apiBasePath(servers: CodegenServer[] | undefined): string {
	if (!servers || !servers.length) {
		return '/'
	}

	const server = servers[0]
	const url = new Url(server.url)
	return url.pathname
}
