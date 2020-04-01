import { camelCase, CodegenGenerator, CodegenOptions } from '@openapi-generator-plus/core'
import pluralize from 'pluralize'

/** Create a default operation name for operations that lack an operationId */
export function defaultOperationName(path: string, method: string): string {
	/* Remove path variables from the path */
	const sanitisedPath = path.replace(/\{[^}]*\}/g, '')
	const combined = `${method.toLocaleLowerCase()}_${sanitisedPath}`
	const sanitizedCombined = combined.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+$/, '')
	return camelCase(sanitizedCombined)
}

export function commonGenerator<O extends CodegenOptions>(): Pick<CodegenGenerator<O>, 'toIteratedModelName' | 'toModelNameFromPropertyName' | 'toOperationName'> {
	return {
		toIteratedModelName: (name, _, iteration) => `${name}${iteration}`,
		toModelNameFromPropertyName: (name, state) => {
			return state.generator.toClassName(pluralize.singular(name), state)
		},
		toOperationName: defaultOperationName,
	}
}
