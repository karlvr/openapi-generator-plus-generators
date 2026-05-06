import { CodegenDocument } from '@openapi-generator-plus/types'
import { NpmOptions, TypeScriptOptions } from '../types'

/**
 * The shape of the root context passed to a TS template. This is the document
 * merged with the generator's `templateRootContext()`, plus generator options.
 *
 * Templates only declare the slice they need; this is the union of well-known
 * fields that typescript-common (and its child generators) put into the context.
 */
export interface TemplateRootContext extends CodegenDocument {
	/* From commonGenerator.templateRootContext() */
	generatedDate: string
	clientGenerator: boolean
	serverGenerator: boolean
	documentationGenerator: boolean

	/* From CodegenOptionsTypeScript (selected fields commonly used in templates) */
	relativeSourceOutputPath: string
	npm: NpmOptions | null
	typescript: TypeScriptOptions | null

	/* Allow children to add their own root-context fields */
	[key: string]: unknown
}

/**
 * Templates that typescript-common knows how to emit by itself. A child generator
 * supplies these via {@link TypeScriptGeneratorContext.templates} when it is fully
 * migrated to TS templates; otherwise typescript-common falls back to the legacy
 * Handlebars partials with the matching name.
 */
export interface TypeScriptCommonTemplates {
	/** Renders the `package.json` content, given merged npm options + root context. */
	package?: (ctx: TemplateRootContext & NpmOptions) => string
	/** Renders the `tsconfig.json` content, given merged ts options + root context. */
	tsconfig?: (ctx: TemplateRootContext & TypeScriptOptions) => string
	/** Renders the `.gitignore` content. */
	gitignore?: (ctx: TemplateRootContext) => string
}

export { gitignore } from './gitignore'
