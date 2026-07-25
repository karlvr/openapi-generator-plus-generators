import { RootContext } from '../types'
import { SKIP, Skip } from '@openapi-generator-plus/template-utils'

/**
 * Extra interfaces configured via `customizations.classes[className].implements`,
 * comma-joined onto a single line. Renders SKIP when there is no
 * customization for `className`.
 */
export function customImplements(className: string, root: RootContext): string | Skip {
	const implementsList = root.customizations.classes[className]?.implements
	if (!implementsList || implementsList.length === 0) {
		return SKIP
	}
	return implementsList.join(', ')
}
