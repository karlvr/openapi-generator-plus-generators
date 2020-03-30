import { camelCase } from '@openapi-generator-plus/core'

/** Create a default operation name for operations that lack an operationId */
export function defaultOperationName(path: string, method: string): string {
	/* Remove path variables from the path */
	const sanitisedPath = path.replace(/\{[^}]*\}/g, '')
	const combined = `${method.toLocaleLowerCase()}_${sanitisedPath}`
	const sanitizedCombined = combined.replace(/^a-zA-Z0-9/g, '_')
	return camelCase(sanitizedCombined)
}
