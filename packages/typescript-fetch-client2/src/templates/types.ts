import { CodegenDocument, CodegenOperation, CodegenGeneratorContext, CodegenContent, CodegenResponse, CodegenOperationGroup } from '@openapi-generator-plus/types'
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

/** Per-operation flags set during postProcessDocument before templates run. */
export interface OperationExtensions {
	addUnauthorizedResponseHandling?: boolean
}

export type AnnotatedOperation = CodegenOperation & OperationExtensions

/**
 * Hook points that a child generator can override. Each hook returns a
 * source-code fragment to splice into the corresponding place. A child wires
 * them up via the chained {@link TypeScriptGeneratorContext.templates} bag.
 */
export interface FetchClient2Hooks {
	/** Imports inserted at the top of each `api/<group>.ts` file. */
	apiImports?: (ctx: RootContext) => string
	/** Imports inserted at the top of `models.ts`. */
	modelsImports?: (ctx: RootContext) => string
	/** Imports/exports inserted at the top of `index.ts`. */
	indexImports?: (ctx: RootContext) => string
	/**
	 * Extra dependency lines for `package.json`. Should be JSON fragments,
	 * one per dependency, that will be joined with `,\n\t\t`.
	 */
	packageDependencies?: (ctx: RootContext) => string[]
	/** Imports inserted near the top of `runtime.ts`, before `defaultFetch`. */
	runtimeImports?: (ctx: RootContext) => string
	/**
	 * Override for the body of an API response branch. Receives the content,
	 * its surrounding response/operation/group, and the document root context.
	 */
	apiResponseContent?: (args: ApiResponseContentArgs) => string
	/**
	 * Override for the `defaultFetch` declaration in `runtime.ts`. If set, the
	 * default browser-fetch fallback is replaced with whatever this returns.
	 */
	defaultFetch?: (ctx: RootContext) => string
}

/** Arguments to the {@link FetchClient2Hooks.apiResponseContent} hook. */
export interface ApiResponseContentArgs {
	content: CodegenContent | null
	response: CodegenResponse
	operation: AnnotatedOperation
	group: CodegenOperationGroup
	rootContext: RootContext
	generatorContext: CodegenGeneratorContext
}

/** A CodegenDocument enriched with the generator's root-context fields. */
export type DocumentContext = CodegenDocument & RootContext
