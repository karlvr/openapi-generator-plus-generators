import { CodegenSchema } from '@openapi-generator-plus/types'
import { ts, md, indentTail, SKIP, Skip } from '@openapi-generator-plus/template-utils'

/**
 * A schema's documentation comment: its description and/or external
 * documentation link. Renders SKIP (dropping the whole comment) when the
 * schema has neither.
 */
export function pojoDocumentation(schema: CodegenSchema): string | Skip {
	if (!schema.description && !schema.externalDocs) {
		return SKIP
	}

	const lines: string[] = []
	if (schema.description) {
		lines.push(` * ${indentTail(md(schema.description), ' * ')}`)
	}
	if (schema.externalDocs) {
		lines.push(` * <p>External documentation: ${schema.externalDocs.url}</p>`)
		if (schema.externalDocs.description) {
			lines.push(` * ${indentTail(md(schema.externalDocs.description), ' * ')}`)
		}
	}

	return ts`
/**
${lines.join('\n')}
 */`
}
