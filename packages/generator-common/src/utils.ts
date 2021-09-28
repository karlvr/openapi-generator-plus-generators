import { CodegenObjectSchema, CodegenProperties, CodegenProperty } from '@openapi-generator-plus/types'
import { idx } from '@openapi-generator-plus/core'

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

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export function stringify(value: any): string {
	if (value === undefined) {
		return 'undefined'
	} else {
		return JSON.stringify(value, refReplacer())
	}
}

/**
 * A replacer function for `JSON.stringify` that manages cycles.
 * Based on https://stackoverflow.com/a/61749783/1951952
 */
function refReplacer() {
	// eslint-disable-next-line @typescript-eslint/ban-types
	const paths = new Map<object, string>()
	let initial: unknown | undefined

	// eslint-disable-next-line @typescript-eslint/ban-types
	return function(this: object, field: string, value: unknown) {
		if (!value || typeof value !== 'object' || value === null) {
			return value
		}

		const knownPath = paths.get(value)
		if (knownPath) {
			return `#REF:${knownPath}`
		}

		if (initial == undefined) {
			initial = value
			paths.set(this, '$')
		}

		const path = `${paths.get(this)}${field ? (Array.isArray(this) ? `[${field}]` : `.${field}`) : ''}`
		paths.set(value, path)

		return value
	}
}
