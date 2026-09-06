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
 * A multipart part that declares its own content type.
 *
 * Each field holds rendered TypeScript, ready to splice into the output. `name`,
 * `value` and `contentType` are expressions, so a hook must not quote them again.
 */
export interface MultipartTypedPartArgs {
	/** The variable that holds the multipart body under construction. */
	bodyPartsVar: string
	/** The name of the part. */
	name: string
	/** The content of the part. */
	value: string
	/** The content type that the specification gives the part. */
	contentType: string
}

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
	/**
	 * Override for a multipart part that declares a content type.
	 *
	 * Each multipart implementation attaches a content type in its own way, and
	 * some cannot take a `Blob` at all.
	 */
	multipartTypedPart?: (args: MultipartTypedPartArgs) => string
}
