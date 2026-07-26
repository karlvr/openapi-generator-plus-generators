import { CodegenProperty, isCodegenNumericSchema } from '@openapi-generator-plus/types'
import { ts, md, indentTail, SKIP, Skip } from '@openapi-generator-plus/template-utils'

/**
 * A property's documentation comment: its description (if any) followed by
 * its numeric bounds (if it's a numeric property with a minimum or maximum).
 * Renders SKIP (dropping the line) when there is nothing to document.
 */
export function propertyDocumentation(property: CodegenProperty): string | Skip {
	const numeric = isCodegenNumericSchema(property.schema) ? property.schema : null

	const lines: string[] = []
	if (property.description) {
		lines.push(`* ${indentTail(md(property.description), ' * ')}`)
	}
	if (numeric) {
		if (numeric.minimum !== null) {
			lines.push(`* minimum: ${numeric.minimum}`)
		}
		if (numeric.maximum !== null) {
			lines.push(`* maximum: ${numeric.maximum}`)
		}
	}
	if (lines.length === 0) {
		return SKIP
	}

	/* The `ts` tag itself aligns continuation lines to the column of this
	   interpolation (one space, matching the literal space before it), so the
	   lines here must NOT be pre-indented again. */
	return ts`
/**
 ${lines.join('\n')}
 */`
}
