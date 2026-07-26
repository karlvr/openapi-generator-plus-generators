import { CodegenOperation } from '@openapi-generator-plus/types'
import { ts, md, indentTail, SKIP, Skip } from '@openapi-generator-plus/template-utils'

/**
 * An operation's documentation comment: its summary, description and/or
 * external documentation link. Renders SKIP (dropping the whole comment) when
 * the operation has none of these.
 */
export function operationDocumentation(operation: CodegenOperation): string | Skip {
	if (!operation.summary && !operation.description && !operation.externalDocs) {
		return SKIP
	}

	const lines: string[] = []
	if (operation.summary) {
		lines.push(` * ${indentTail(md(operation.summary), ' * ')}`)
	}
	if (operation.description) {
		lines.push(` * ${indentTail(md(operation.description), ' * ')}`)
	}
	if (operation.externalDocs) {
		lines.push(` * <p>External documentation: ${operation.externalDocs.url}</p>`)
		if (operation.externalDocs.description) {
			lines.push(` * ${indentTail(md(operation.externalDocs.description), ' * ')}`)
		}
	}

	return ts`
/**
${lines.join('\n')}
 */`
}
