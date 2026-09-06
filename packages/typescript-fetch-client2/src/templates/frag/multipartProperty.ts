import { CodegenContentPropertyEncoding, CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { stringLiteral } from '@openapi-generator-plus/template-utils'
import { FetchClient2Hooks, MultipartTypedPartArgs } from '../types'

export interface MultipartPropertyArgs {
	encoding: CodegenContentPropertyEncoding
	propertyVar: string
	bodyPartsVar: string
	generatorContext: CodegenGeneratorContext
	hooks: FetchClient2Hooks
}

/**
 * Default body for the `multipartTypedPart` hook: a `Blob`, which is the only
 * value that the browser `FormData` lets a caller give a content type.
 *
 * A form gives every `Blob` the filename `blob`, so the part names a file. A
 * multipart implementation that can declare a content type without a filename
 * should override the hook.
 */
export function defaultMultipartTypedPart({ bodyPartsVar, name, value, contentType }: MultipartTypedPartArgs): string {
	return `${bodyPartsVar}.append(${name}, new Blob([${value}], { type: ${contentType} }));`
}

/**
 * Report whether a multipart part can carry a null value. A JSON part encodes null directly. A
 * text part encodes it as an empty string. A binary part has no null form, so the caller must
 * omit it.
 */
export function multipartPartCanBeNull(encoding: CodegenContentPropertyEncoding): boolean {
	return encoding.contentType !== 'application/octet-stream'
}

export function multipartProperty({ encoding, propertyVar, bodyPartsVar, generatorContext, hooks }: MultipartPropertyArgs): string {
	const propLiteral = stringLiteral(generatorContext, encoding.property.serializedName)
	const valueAccess = encoding.valueProperty
		? `${propertyVar}[${stringLiteral(generatorContext, encoding.valueProperty.serializedName)}]`
		: propertyVar
	const contentType = encoding.contentType
	if (contentType === 'application/json') {
		return (hooks.multipartTypedPart ?? defaultMultipartTypedPart)({
			bodyPartsVar,
			name: propLiteral,
			value: `JSON.stringify(${valueAccess})`,
			contentType: stringLiteral(generatorContext, contentType),
		})
	}
	if (contentType === 'application/octet-stream') {
		return `${bodyPartsVar}.append(${propLiteral}, ${valueAccess});`
	}
	return `${bodyPartsVar}.append(${propLiteral}, String(${valueAccess} || ''));`
}
