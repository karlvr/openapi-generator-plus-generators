import { CodegenGenerator, CodegenServer, CodegenSchemaPurpose, CodegenGeneratorContext, CodegenConfig, CodegenGeneratorType } from '@openapi-generator-plus/types'
import { camelCase } from './case-transforms'
export * from './case-transforms'
export * from './http-methods'
export * from './utils'
export * from './config'
import Url from 'url-parse'
import pluralize from 'pluralize'

export function commonGenerator(config: CodegenConfig, context: CodegenGeneratorContext): Pick<CodegenGenerator, 'toOperationName' | 'toSchemaName' | 'toSuggestedSchemaName' | 'templateRootContext'> {
	return {
		/** Create a default operation name for operations that lack an operationId */
		toOperationName: (path: string, method: string): string => {
			/* Remove path variables from the path */
			const sanitisedPath = path.replace(/\{[^}]*\}/g, '')
			const combined = `${method.toLocaleLowerCase()}_${sanitisedPath}`
			const sanitizedCombined = combined.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+$/, '')
			return camelCase(sanitizedCombined)
		},
		
		toSchemaName: (name) => {
			return name
		},

		toSuggestedSchemaName: (name, options) => {
			if (options.purpose === CodegenSchemaPurpose.ARRAY_ITEM || options.purpose === CodegenSchemaPurpose.MAP_VALUE) {
				return pluralize.singular(name)
			} else {
				return name
			}
		},

		templateRootContext: () => {
			return {
				generatedDate: new Date().toISOString(),
				clientGenerator: context.generator().generatorType() === CodegenGeneratorType.CLIENT,
				serverGenerator: context.generator().generatorType() === CodegenGeneratorType.SERVER,
				documentationGenerator: context.generator().generatorType() === CodegenGeneratorType.DOCUMENTATION,
			}
		},

	}
}

export function apiBasePath(servers: CodegenServer[] | null): string {
	if (!servers || !servers.length) {
		return '/'
	}

	const server = servers[0]
	const url = new Url(server.url)
	return url.pathname
}
