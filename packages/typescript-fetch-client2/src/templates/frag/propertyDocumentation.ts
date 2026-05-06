import { CodegenProperty, CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { ts, className, md, isNumeric, when, maybe } from '@openapi-generator-plus/template-utils'

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
${maybe(property.description, d => ` * @description ${md(d)}`)}
 * @type {${property.nativeType.serializedType}}
${maybe(memberOf, m => ` * @memberof ${className(generatorContext.generator(), m)}`)}
${when(numericSchema && numericSchema.minimum !== null, () => ` * minimum: ${numericSchema!.minimum}`)}
${when(numericSchema && numericSchema.maximum !== null, () => ` * maximum: ${numericSchema!.maximum}`)}
${when(property.deprecated, ' * @deprecated')}
 */`
}
