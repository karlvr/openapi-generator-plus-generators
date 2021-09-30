import { CodegenObjectSchema, CodegenProperties, CodegenProperty } from '@openapi-generator-plus/types'
import { idx } from '@openapi-generator-plus/core'
export { stringify, debugStringify } from '@openapi-generator-plus/core'

/**
 * Return an object containing all of the unique properties, including inherited properties, for a schema, where properties
 * in child schemas override any same-named properties in parent schemas.
 * @param schemas 
 * @param result 
 */
export function uniquePropertiesIncludingInherited(schemas: CodegenObjectSchema[], result: CodegenProperties = idx.create()): CodegenProperty[] {
	const open = [...schemas]
	for (const schema of open) {
		if (schema.properties) {
			idx.merge(result, schema.properties)
		}
		if (schema.parents) {
			for (const aParent of schema.parents) {
				if (open.indexOf(aParent) === -1) {
					open.push(aParent)
				}
			}
		}
	}

	return idx.allValues(result)
}
