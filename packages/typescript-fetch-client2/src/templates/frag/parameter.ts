import { CodegenParameter, CodegenRequestBody, CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { identifier } from '@openapi-generator-plus/template-utils'

/**
 * Render a single parameter declaration: `name: nativeType` (or `| undefined`
 * if the parameter is optional).
 */
export function parameter(generatorContext: CodegenGeneratorContext, p: CodegenParameter | CodegenRequestBody): string {
	const optional = !p.required ? ' | undefined' : ''
	return `${identifier(generatorContext.generator(), p.name)}: ${p.nativeType}${optional}`
}
