import { CodegenGenerator, CodegenServer, CodegenSchemaPurpose, CodegenGeneratorContext, CodegenConfig } from '@openapi-generator-plus/types'
import { camelCase } from './case-transforms'
export * from './case-transforms'
export * from './http-methods'
export * from './utils'
import Url from 'url-parse'
import pluralize from 'pluralize'

export function commonGenerator(config: CodegenConfig, context: CodegenGeneratorContext): Pick<CodegenGenerator, 'toOperationName' | 'toSchemaName' | 'templateRootContext'> {
	return {
		/** Create a default operation name for operations that lack an operationId */
		toOperationName: (path: string, method: string): string => {
			/* Remove path variables from the path */
			const sanitisedPath = path.replace(/\{[^}]*\}/g, '')
			const combined = `${method.toLocaleLowerCase()}_${sanitisedPath}`
			const sanitizedCombined = combined.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+$/, '')
			return camelCase(sanitizedCombined)
		},
		
		toSchemaName: (name, options) => {
			if (options.nameSpecified) {
				return context.generator().toClassName(name)
			}
			
			if (options.purpose === CodegenSchemaPurpose.ARRAY_ITEM || options.purpose === CodegenSchemaPurpose.MAP_VALUE) {
				return context.generator().toClassName(pluralize.singular(name))
			} else {
				return context.generator().toClassName(name)
			}
		},

		templateRootContext: () => {
			return {
				generatedDate: new Date().toISOString(),
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
