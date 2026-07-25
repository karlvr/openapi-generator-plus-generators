import { ts } from '@openapi-generator-plus/template-utils'
import { header } from './header'
import { DocumentContext } from './types'

/**
 * Renders the package's `index.ts` (the entry point that re-exports the API).
 * Named `entry` here to avoid clashing with the templates module's own
 * `index.ts`.
 */
export function entry(ctx: DocumentContext): string {
	return ts`
${header(ctx)}

export * from "./api";
export * from "./models";
export * from "./configuration";
export { RequiredError } from "./runtime";
export type { FetchAPI, FetchArgs } from "./runtime";
`
}
