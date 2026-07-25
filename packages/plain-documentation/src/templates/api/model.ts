import { CodegenSchema } from '@openapi-generator-plus/types'
import { ts } from '@openapi-generator-plus/template-utils'
import { mainPanel } from '../model/schema'

/**
 * Render `model` inside its documentation panel. Use when a schema needs its
 * own panel rendered inline (an anonymous request/response body, or an entry
 * in the schemas index).
 */
export function modelPanel(model: CodegenSchema, anchor: string | undefined, hideName?: boolean): string {
	// model.hbs opens with a comment; the blank line that originally followed
	// it survives into the rendered output.
	return ts`

${mainPanel(model, anchor, hideName)}`
}
