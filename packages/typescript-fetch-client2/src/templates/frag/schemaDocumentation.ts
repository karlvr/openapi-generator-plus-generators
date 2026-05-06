import { CodegenSchema } from '@openapi-generator-plus/types'
import { ts, md, indent } from '@openapi-generator-plus/template-utils'

export function schemaDocumentation(schema: CodegenSchema): string {
	if (!schema.description && !schema.externalDocs && !schema.deprecated) {
		return ''
	}
	return ts`/**
${schema.description ? indent(md(schema.description), ' * ') : null}
${schema.externalDocs ? ` * <p>External documentation: ${schema.externalDocs.url}</p>` : null}
${schema.externalDocs?.description ? indent(md(schema.externalDocs.description), ' * ') : null}
${schema.deprecated ? ' * @deprecated' : null}
 */`
}
