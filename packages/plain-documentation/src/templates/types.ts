import { CodegenDocument, CodegenOperation } from '@openapi-generator-plus/types'
import { CodegenOptionsDocumentation } from '../types'

/**
 * The root context shared by every template in this generator: the document's
 * generator-wide options plus the fields common to all generators.
 */
export interface RootContext extends CodegenOptionsDocumentation {
	generatedDate: string
	clientGenerator: boolean
	serverGenerator: boolean
	documentationGenerator: boolean
	generatorClass: string
}

/** A CodegenDocument enriched with the generator's root-context fields. */
export type DocumentContext = CodegenDocument & RootContext

/**
 * Extension points that a consumer of this package's templates can use to
 * splice their own markup into the generated documentation, without needing
 * to fork the templates that produce the surrounding page. Each hook's
 * default (when left unset) is empty, matching the original extension
 * partials this package shipped, which had no content of their own.
 */
export interface PlainDocumentationHooks {
	/** Extra markup appended to `<head>`, just before it closes. */
	head?: (ctx: RootContext) => string
	/** Extra markup inserted at the top of an operation's section, after its title. */
	operationHeader?: (operation: CodegenOperation, ctx: RootContext) => string
	/** Extra markup inserted at the end of an operation's section, before it closes. */
	operationFooter?: (operation: CodegenOperation, ctx: RootContext) => string
}
