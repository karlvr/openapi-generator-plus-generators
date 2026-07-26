import { marked } from 'marked'

/**
 * Render `value` as Markdown to HTML, returning an empty string for empty input.
 *
 * Mirrors the legacy `md` Handlebars helper.
 */
export function md(value: string | null | undefined): string {
	if (typeof value !== 'string') {
		return ''
	}
	const result = marked(value)
	if (typeof result !== 'string') {
		throw new Error('md helper encountered unexpected non-string result from marked')
	}
	return result.trim()
}
