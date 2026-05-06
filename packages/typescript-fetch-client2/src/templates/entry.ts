import { ts, each, identifier, className, SKIP } from '@openapi-generator-plus/template-utils'
import { CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { header } from './header'
import { DocumentContext, FetchClient2Hooks, RootContext } from './types'

/**
 * Renders the package's `index.ts` (the entry point that re-exports the API).
 * Named `entry` here to avoid clashing with the templates module's own
 * `index.ts`.
 */
export function entry(generatorContext: CodegenGeneratorContext, ctx: DocumentContext, hooks: FetchClient2Hooks): string {
	const ext = ctx.esm ? '.js' : ''
	const groups = ctx.groups
	const indexImports = hooks.indexImports?.(ctx as RootContext)
	const gen = generatorContext.generator()

	return ts`${header(ctx)}

${indexImports || SKIP}
import { Configuration } from './configuration${ext}'
${each(groups, (g) => `import { withConfiguration as ${identifier(gen, g.name)}ApiWithConfiguration } from './api/${identifier(gen, g.name)}${ext}'`, '\n')}

export * from "./models${ext}";
export * from "./configuration${ext}";
export { RequiredError, isUnexpectedResponse, isDocumentedResponse } from "./runtime${ext}";
export type { FetchAPI, FetchArgs, UndocumentedResponse, FetchErrorResponse, UnexpectedResponse } from "./runtime${ext}";

${each(groups, (g) => `export { default as ${className(gen, g.name)}Api } from './api/${identifier(gen, g.name)}${ext}'`, '\n')}

export function withConfiguration(configuration: Configuration) {
	return {
${each(groups, (g) => `		${className(gen, g.name)}Api: ${identifier(gen, g.name)}ApiWithConfiguration(configuration),`, '\n')}
	}
}
`
}
