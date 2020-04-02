import { CodegenGenerator, CodegenOptions } from '@openapi-generator-plus/types'
import { camelCase } from './case-transforms'
export * from './case-transforms'
export * from './http-methods'

import * as allGroupingStrategies from './operation-grouping'
export const GroupingStrategies = allGroupingStrategies

export function commonGenerator<O extends CodegenOptions>(): Pick<CodegenGenerator<O>, 'toOperationName'> {
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
