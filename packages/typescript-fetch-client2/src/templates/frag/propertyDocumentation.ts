import { CodegenProperty, CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { ts, className, md, isNumeric } from '@openapi-generator-plus/template-utils'

export interface PropertyDocumentationContext {
	property: CodegenProperty
	memberOf: string | null
	generatorContext: CodegenGeneratorContext
}

export function propertyDocumentation({ property, memberOf, generatorContext }: PropertyDocumentationContext): string {
	const showBlock = !!property.description || isNumeric(property.schema) || property.deprecated
	if (!showBlock) {
		return ''
	}
	const numericSchema = isNumeric(property.schema) ? (property.schema as unknown as { minimum: number | null; maximum: number | null }) : null
	return ts`/**
${property.description ? ` * @description ${md(property.description)}` : null}
 * @type {${property.nativeType.serializedType}}
${memberOf ? ` * @memberof ${className(generatorContext.generator(), memberOf)}` : null}
${numericSchema && numericSchema.minimum !== null ? ` * minimum: ${numericSchema.minimum}` : null}
${numericSchema && numericSchema.maximum !== null ? ` * maximum: ${numericSchema.maximum}` : null}
${property.deprecated ? ' * @deprecated' : null}
 */`
}
