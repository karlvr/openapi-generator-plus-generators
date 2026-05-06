import {
	CodegenObjectSchema,
	CodegenOperation,
	CodegenProperty,
	CodegenRequestBody,
	CodegenResponse,
	CodegenContent,
	CodegenExamples,
} from '@openapi-generator-plus/types'
import {
	uniquePropertiesIncludingInherited,
	uniquePropertiesIncludingInheritedForParents,
} from '@openapi-generator-plus/generator-common'
import * as idx from '@openapi-generator-plus/indexed-type'

/**
 * Return the inherited properties of a schema, excluding any that are shadowed
 * by a property defined directly on the schema.
 */
export function inheritedProperties(schema: CodegenObjectSchema): CodegenProperty[] {
	if (!schema.parents) {
		return []
	}
	const parentProperties = idx.allValues(uniquePropertiesIncludingInheritedForParents(schema.parents))
	if (schema.properties) {
		const myProperties = schema.properties
		return parentProperties.filter(p => !idx.get(myProperties, p.name))
	}
	return parentProperties
}

/** Return all unique properties of `schema`, including inherited. */
export function allProperties(schema: CodegenObjectSchema): CodegenProperty[] {
	return idx.allValues(uniquePropertiesIncludingInherited(schema))
}

/** Return only the required properties of `schema` (own only). */
export function requiredProperties(schema: CodegenObjectSchema): CodegenProperty[] {
	if (!schema.properties) {
		return []
	}
	return idx.allValues(idx.filter(schema.properties, p => p.required))
}

/** Return responses on the operation that are not the default response. */
export function nonDefaultResponses(operation: CodegenOperation): CodegenResponse[] {
	if (!operation.responses) {
		return []
	}
	return idx.allValues(operation.responses).filter(response => !response.isDefault)
}

/** Return responses on the operation that are not default and not catch-all. */
export function nonDefaultAndCatchAllResponses(operation: CodegenOperation): CodegenResponse[] {
	if (!operation.responses) {
		return []
	}
	return idx.allValues(operation.responses).filter(response => !response.isDefault && !response.isCatchAll)
}

/**
 * Return one entry per content of the response, or a single entry with
 * `content: null` if the response has no contents. This mirrors the
 * `responseContentAndNone` Handlebars helper, which is useful when iterating
 * over a response for code generation.
 */
export function responseContentAndNone(response: CodegenResponse): { content: CodegenContent | null }[] {
	if (response.contents) {
		return response.contents.map(content => ({ content }))
	}
	return [{ content: null }]
}

function isExamplesEmpty(examples: CodegenExamples): boolean {
	for (const _ in examples) {
		return false
	}
	return true
}

/** Whether the given target (response or request body) has any non-empty examples. */
export function hasExamples(target: CodegenResponse | CodegenRequestBody): boolean {
	if (!target.contents) {
		return false
	}
	return !!target.contents.find(c => c.examples && !isExamplesEmpty(c.examples))
}
