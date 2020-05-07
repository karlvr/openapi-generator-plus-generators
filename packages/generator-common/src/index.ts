import { CodegenGenerator, CodegenServer, CodegenSchemaPurpose } from '@openapi-generator-plus/types'
import { camelCase } from './case-transforms'
export * from './case-transforms'
export * from './http-methods'
import Url from 'url-parse'
import pluralize from 'pluralize'

export function commonGenerator<O>(): Pick<CodegenGenerator<O>, 'toOperationName' | 'toModelName'> {
	return {

		/** Create a default operation name for operations that lack an operationId */
		toOperationName: (path: string, method: string): string => {
			/* Remove path variables from the path */
			const sanitisedPath = path.replace(/\{[^}]*\}/g, '')
			const combined = `${method.toLocaleLowerCase()}_${sanitisedPath}`
			const sanitizedCombined = combined.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+$/, '')
			return camelCase(sanitizedCombined)
		},
		
		toModelName: (name, options, state) => {
			if (options.purpose === CodegenSchemaPurpose.ARRAY_ITEM || options.purpose === CodegenSchemaPurpose.MAP_VALUE) {
				return state.generator.toClassName(pluralize.singular(name), state)
			} else {
				return state.generator.toClassName(name, state)
			}
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
