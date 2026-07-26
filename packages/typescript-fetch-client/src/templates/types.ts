import { CodegenDocument, CodegenContent } from '@openapi-generator-plus/types'
import { TemplateRootContext as BaseRootContext } from '@openapi-generator-plus/typescript-generator-common'
import { CodegenOptionsTypeScriptFetchClient } from '../types'

/**
 * The root context shared by every template in this generator. Composed of
 * the document, the typescript-common root context, and this generator's
 * options.
 */
export type RootContext = BaseRootContext & CodegenOptionsTypeScriptFetchClient & {
	generatorClass: string
}

/** A CodegenDocument enriched with the generator's root-context fields. */
export type DocumentContext = CodegenDocument & RootContext

/**
 * Hook points that a child generator can override. Each hook returns a
 * source-code fragment to splice into the corresponding place. A child wires
 * them up via the chained {@link TypeScriptGeneratorContext.templates} bag.
 */
export interface FetchClientHooks {
	/** Imports inserted at the top of the `api.ts` output file. */
	apiImports?: (ctx: RootContext) => string
	/** Imports inserted at the top of the `models.ts` output file. */
	modelsImports?: (ctx: RootContext) => string
	/**
	 * Extra dependency lines for `package.json`. Should be JSON fragments,
	 * one per dependency, that will be joined with `,\n\t\t`.
	 */
	packageDependencies?: (ctx: RootContext) => string[]
	/** Imports inserted near the top of `runtime.ts`, before `defaultFetch`. */
	runtimeImports?: (ctx: RootContext) => string
	/**
	 * Override for the body of a documented (default) response's content
	 * branch — what runs inside `if (mimeType === ...)` for each content type
	 * the response declares.
	 */
	apiResponseContent?: (content: CodegenContent) => string
}
