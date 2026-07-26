import { SKIP, Skip } from '@openapi-generator-plus/template-utils'
import { RootContext } from '../types'

/**
 * The extra `import` statements configured via the `imports` option, followed by
 * a blank line. Renders SKIP (dropping the line) when there are none configured.
 */
export function imports(root: RootContext): string | Skip {
	if (!root.imports || root.imports.length === 0) {
		return SKIP
	}
	return root.imports.map(imp => `import ${imp};`).join('\n') + '\n'
}
