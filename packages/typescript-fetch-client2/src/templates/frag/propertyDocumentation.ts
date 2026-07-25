import { CodegenGeneratorContext, CodegenParameter, CodegenProperty, isCodegenNumericSchema } from '@openapi-generator-plus/types'
import { ts, className, md, indentTail, when, maybe, SKIP } from '@openapi-generator-plus/template-utils'

export interface PropertyDocumentationContext {
	/** The property, or parameter, to document; both carry the fields we document. */
	property: CodegenProperty | CodegenParameter
	memberOf: string | null
	generatorContext: CodegenGeneratorContext
}

export function propertyDocumentation({ property, memberOf, generatorContext }: PropertyDocumentationContext): string {
	const numericSchema = isCodegenNumericSchema(property.schema) ? property.schema : null
	const showBlock = !!property.description || numericSchema !== null || property.deprecated
	if (!showBlock) {
		return ''
	}
	const minimum = numericSchema && numericSchema.minimum !== null ? ` * minimum: ${numericSchema.minimum}` : SKIP
	const maximum = numericSchema && numericSchema.maximum !== null ? ` * maximum: ${numericSchema.maximum}` : SKIP
	return ts`
/**
${maybe(property.description, d => ` * ${indentTail(`@description ${md(d)}`, ' *  ')}`)}
 * @type {${property.nativeType.serializedType}}
${maybe(memberOf, m => ` * @memberof ${className(generatorContext.generator(), m)}`)}
${minimum}
${maximum}
${when(property.deprecated, ' * @deprecated')}
 */`
}
