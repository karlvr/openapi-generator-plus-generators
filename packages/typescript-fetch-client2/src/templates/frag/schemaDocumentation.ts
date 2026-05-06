import { CodegenSchema } from '@openapi-generator-plus/types'
import { ts, md, indent, SKIP } from '@openapi-generator-plus/template-utils'

export function schemaDocumentation(schema: CodegenSchema): string {
	if (!schema.description && !schema.externalDocs && !schema.deprecated) {
		return ''
	}
	return ts`/**
${schema.description ? indent(md(schema.description), ' * ') : SKIP}
${schema.externalDocs ? ` * <p>External documentation: ${schema.externalDocs.url}</p>` : SKIP}
${schema.externalDocs?.description ? indent(md(schema.externalDocs.description), ' * ') : SKIP}
${schema.deprecated ? ' * @deprecated' : SKIP}
 */`
}
