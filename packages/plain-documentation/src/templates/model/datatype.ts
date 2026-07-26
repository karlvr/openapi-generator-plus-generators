import { CodegenArraySchema, CodegenEnumSchema, CodegenMapSchema, CodegenNativeType, CodegenSchema, CodegenValue, isCodegenArraySchema, isCodegenEnumSchema, isCodegenMapSchema } from '@openapi-generator-plus/types'
import { each, isAllOf, isAnyOf, isObject, isOneOf, ts, when } from '@openapi-generator-plus/template-utils'
import * as idx from '@openapi-generator-plus/indexed-type'
import { e, htmlId, stringify } from '../helpers'

/**
 * The subset of a schema usage (a property, parameter, discriminator, or an
 * array/map's component) that {@link datatype} needs in order to describe the
 * usage's type.
 */
export interface DatatypeUsage {
	schema: CodegenSchema
	nativeType: CodegenNativeType
	defaultValue?: CodegenValue | null
}

/**
 * Render the type column of a documentation table: a link to the schema's
 * own panel when it has one, an inline description of its shape (map, array
 * or anonymous enum) when it doesn't, and the usage's default value, if any.
 */
export function datatype(usage: DatatypeUsage, anchor: string | undefined): string {
	const { defaultValue } = usage
	return ts`<span class="model-property-type">
${bodyAndClose(usage, anchor)}
${when(defaultValue, () => `    <span class="model-property-default-value">${e(stringify(defaultValue!.value))}</span>`)}`
}

/**
 * Render the body of the type span together with its closing `</span>`.
 * Handlebars' whitespace control (verified empirically against the original
 * template) closes the span at column 0 for every branch except the final
 * plain-type fallback in the anchor/isObject/isMap/isArray/isEnum chain,
 * which it leaves indented 8 spaces — an artifact of that branch being the
 * last `{{else}}` in a chain of sibling `{{else if}}` blocks.
 */
function bodyAndClose(usage: DatatypeUsage, anchor: string | undefined): string {
	const { schema, nativeType } = usage
	if (!anchor) {
		return `        ${e(String(nativeType))}\n</span>`
	}
	if (isObject(schema) || isAllOf(schema) || isAnyOf(schema) || isOneOf(schema)) {
		return `            <a class="model-ref" href="#${anchor}/${htmlId(nativeType.concreteType)}">${e(String(nativeType))}</a>\n</span>`
	}
	if (isCodegenMapSchema(schema)) {
		return `${mapOrArrayType(usage, schema, anchor, 'map')}\n</span>`
	}
	if (isCodegenArraySchema(schema)) {
		return `${mapOrArrayType(usage, schema, anchor, 'array')}\n</span>`
	}
	if (isCodegenEnumSchema(schema)) {
		return `${enumType(usage, schema, anchor)}\n</span>`
	}
	return `${plainType(nativeType)}\n        </span>`
}

function mapOrArrayType(usage: DatatypeUsage, schema: CodegenMapSchema | CodegenArraySchema, anchor: string, kind: 'map' | 'array'): string {
	const { component } = schema
	if (!component.schema.anonymous) {
		return `            <a class="model-ref" href="#${anchor}/${htmlId(component.nativeType.concreteType)}">${e(String(usage.nativeType))}</a>`
	}
	// The recursive call is itself a Handlebars partial invocation, and its
	// compiled template has a trailing newline (from the end of the file),
	// which surfaces here as a blank line after the nested type.
	return `            ${kind} of ${datatype(component, anchor)}\n`
}

function enumType(usage: DatatypeUsage, schema: CodegenEnumSchema, anchor: string): string {
	if (!schema.anonymous) {
		return `            <a class="model-ref" href="#${anchor}/${htmlId(usage.nativeType.concreteType)}">${e(String(usage.nativeType))}</a>`
	}
	const enumValues = schema.enumValues ? idx.allValues(schema.enumValues) : []
	return ts`            <span class="model-property-enum">
            enum ∈ {
${each(enumValues, (v, i, first, last) => `                    <span class="model-property-enum-item" title="${e(v.literalValue)}">${e(v.name)}${!last ? ', ' : ''}</span>`, '\n')}
            }
            </span>`
}

function plainType(nativeType: CodegenNativeType): string {
	const nativeTypeString = String(nativeType)
	const lines = [`            ${e(nativeTypeString)}`]
	if (nativeType.serializedType && nativeType.serializedType !== nativeTypeString) {
		lines.push(`            (${e(nativeType.serializedType)})`)
	}
	return lines.join('\n')
}
