import { CodegenSchema } from '@openapi-generator-plus/types'
import { ts, md, indent, when, maybe } from '@openapi-generator-plus/template-utils'

export function schemaDocumentation(schema: CodegenSchema): string {
	if (!schema.description && !schema.externalDocs && !schema.deprecated) {
		return ''
	}
	return ts`/**
${maybe(schema.description, d => indent(md(d), ' * '))}
${maybe(schema.externalDocs, ed => ` * <p>External documentation: ${ed.url}</p>`)}
${maybe(schema.externalDocs?.description, d => indent(md(d), ' * '))}
${when(schema.deprecated, ' * @deprecated')}
 */`
}
