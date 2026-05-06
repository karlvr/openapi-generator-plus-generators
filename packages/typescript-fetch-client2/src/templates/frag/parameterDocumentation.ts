import { CodegenParameter, CodegenRequestBody, CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { identifier, md } from '@openapi-generator-plus/template-utils'

export function parameterDocumentation(generatorContext: CodegenGeneratorContext, p: CodegenParameter | CodegenRequestBody): string {
	const name = (p as CodegenParameter & CodegenRequestBody).name
	const id = identifier(generatorContext.generator(), name)
	const namePart = p.required ? id : `[${id}]`
	const deprecated = p.deprecated ? ' (Deprecated)' : ''
	const description = p.description ? ` ${md(p.description)}` : ''
	return `@param {${p.nativeType}} ${namePart}${deprecated}${description}`
}
