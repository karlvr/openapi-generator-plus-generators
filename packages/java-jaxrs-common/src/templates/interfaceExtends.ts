import { CodegenInterfaceSchema } from '@openapi-generator-plus/types'

/**
 * The `extends` clause of an interface declaration (with a trailing space),
 * combining the interface's own parent interfaces and the
 * `x-implements-interfaces` vendor extension. Renders an empty string if the
 * interface has neither.
 */
export function interfaceExtends(schema: CodegenInterfaceSchema): string {
	const parts: string[] = []
	if (schema.parents) {
		for (const parent of schema.parents) {
			parts.push(`${parent.nativeType.parentType}`)
		}
	}
	const vendorInterfaces = schema.vendorExtensions?.['x-implements-interfaces']
	if (vendorInterfaces !== undefined) {
		parts.push(String(vendorInterfaces))
	}
	if (parts.length === 0) {
		return ''
	}
	return `extends ${parts.join(', ')} `
}
