import { CodegenContentPropertyEncoding, CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { stringLiteral } from '@openapi-generator-plus/template-utils'

export interface MultipartPropertyArgs {
	encoding: CodegenContentPropertyEncoding
	propertyVar: string
	bodyPartsVar: string
	generatorContext: CodegenGeneratorContext
}

/**
 * Report whether a multipart part can carry a null value. A JSON part encodes null directly. A
 * text part encodes it as an empty string. A binary part has no null form, so the caller must
 * omit it.
 */
export function multipartPartCanBeNull(encoding: CodegenContentPropertyEncoding): boolean {
	return encoding.contentType !== 'application/octet-stream'
}

export function multipartProperty({ encoding, propertyVar, bodyPartsVar, generatorContext }: MultipartPropertyArgs): string {
	const propLiteral = stringLiteral(generatorContext, encoding.property.serializedName)
	const valueAccess = encoding.valueProperty
		? `${propertyVar}[${stringLiteral(generatorContext, encoding.valueProperty.serializedName)}]`
		: propertyVar
	const contentType = encoding.contentType
	if (contentType === 'application/json') {
		return `${bodyPartsVar}.append(${propLiteral}, JSON.stringify(${valueAccess}));`
	}
	if (contentType === 'application/octet-stream') {
		return `${bodyPartsVar}.append(${propLiteral}, ${valueAccess});`
	}
	return `${bodyPartsVar}.append(${propLiteral}, String(${valueAccess} || ''));`
}
