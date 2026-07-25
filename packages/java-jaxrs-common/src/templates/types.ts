import { CodegenObjectSchema, CodegenInterfaceSchema, CodegenWrapperSchema, CodegenEnumSchema, CodegenProperty, CodegenSchemaInfo } from '@openapi-generator-plus/types'
import { Skip } from '@openapi-generator-plus/template-utils'
import { CodegenOptionsJava } from '../types'
import type { JavaGeneratorContext } from '../index'

/**
 * The root context shared by every template in this generator's model-emission
 * path: the document's generator-wide Java options plus the fields common to
 * all generators. A child generator's actual root context has more fields
 * than this (its own package options); this is the subset the model
 * templates rely on.
 */
export interface RootContext extends CodegenOptionsJava {
	generatedDate: string
	clientGenerator: boolean
	serverGenerator: boolean
	documentationGenerator: boolean
	generatorClass: string

	/* Allow a child generator's own root-context fields (e.g. its own package options). */
	[key: string]: unknown
}

/**
 * Bundles the pieces a model-path template function needs to render: the
 * generator context (for `generator()`, native types and similar), the root
 * options context, and the effective hook bag — this generator's defaults
 * merged with whatever a child generator has overridden.
 *
 * `templates` is fully populated (every hook has a concrete function, even if
 * its default renders nothing) so call sites never need to guard against a
 * missing hook.
 */
export interface JavaModelContext {
	generatorContext: JavaGeneratorContext
	root: RootContext
	templates: Required<JavaJaxrsTemplates>
}

/**
 * Hook points that a child generator can override for the model-emission
 * templates (pojo/enum/interface/wrapper and their nested forms). Each hook
 * mirrors a `hooks/*` Handlebars partial that a child package previously
 * overrode by supplying a same-named template file; a child now supplies its
 * replacement via the chained {@link JavaGeneratorContext.templates} bag
 * (see `chainJavaGeneratorContext`).
 *
 * Every hook's default (when left unset) renders the same content as the
 * original extension partial's default, which for most of these is nothing.
 */
export interface JavaJaxrsTemplates {
	/** Extra content at the top of a class's body, before its nested models and properties. */
	pojoHeader?: (schema: CodegenObjectSchema, ctx: JavaModelContext) => string | Skip
	/** Extra content at the end of a class's body, after its generated methods. */
	pojoFooter?: (schema: CodegenObjectSchema, ctx: JavaModelContext) => string | Skip
	/** Extra annotations on a class or interface declaration, in addition to the standard `@Schema`/`@JsonTypeInfo` ones. */
	pojoHeaderAnnotations?: (schema: CodegenObjectSchema | CodegenInterfaceSchema, ctx: JavaModelContext) => string | Skip
	/** Extra annotations on a property field, in addition to the standard `@JsonProperty`. */
	pojoPropertyAnnotations?: (property: CodegenProperty, ctx: JavaModelContext) => string | Skip
	/** Extra `implements` entries for a class, one per line, in addition to any configured via `customizations`. */
	pojoImplementsExtras?: (schema: CodegenObjectSchema | CodegenWrapperSchema, ctx: JavaModelContext) => string | Skip
	/** Extra annotations on an enum declaration, before `enumHeaderAnnotations`. */
	enumHeader?: (schema: CodegenEnumSchema, ctx: JavaModelContext) => string | Skip
	/** Extra content at the end of an enum's body, after its generated methods. */
	enumFooter?: (schema: CodegenEnumSchema, ctx: JavaModelContext) => string | Skip
	/** Extra annotations on an enum declaration, in addition to the standard `@Schema`/`@XmlType` ones. */
	enumHeaderAnnotations?: (schema: CodegenEnumSchema, ctx: JavaModelContext) => string | Skip
	/** Extra annotations on a wrapper class declaration, in addition to the standard `@XmlRootElement`. */
	wrapperHeaderAnnotations?: (schema: CodegenWrapperSchema, ctx: JavaModelContext) => string | Skip
	/**
	 * Extra bean-validation annotation properties (e.g. validation groups) added
	 * to a validation annotation. Called with either the property being
	 * validated (for the property's own `@NotNull`) or its schema (for
	 * constraints derived from the schema's validation keywords) — both share
	 * the {@link CodegenSchemaInfo} fields this hook needs.
	 */
	beanValidationAnnotationProperties?: (target: CodegenSchemaInfo, ctx: JavaModelContext) => string | Skip
}
