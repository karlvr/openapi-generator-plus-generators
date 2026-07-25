import { CodegenObjectSchema, CodegenInterfaceSchema, CodegenWrapperSchema, CodegenEnumSchema, CodegenProperty, CodegenSchemaInfo, CodegenOperationGroup, CodegenOperation, CodegenResponse, CodegenSecurityScheme } from '@openapi-generator-plus/types'
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
	/** Every security scheme declared in the API document, regardless of which operations use it. */
	securitySchemes: CodegenSecurityScheme[] | null

	/* Allow a child generator's own root-context fields (e.g. its own package options). */
	[key: string]: unknown
}

/**
 * Bundles the pieces a template function needs to render: the generator
 * context (for `generator()`, native types and similar), the root options
 * context, and the effective hook bag — this generator's defaults merged with
 * whatever a child generator has overridden. Used throughout this generator
 * family's templates, for both the model-emission path and the API path
 * (operations, services, invokers and similar).
 *
 * `templates` is fully populated (every hook has a concrete function, even if
 * its default renders nothing) so call sites never need to guard against a
 * missing hook.
 */
export interface JavaModelContext {
	generatorContext: JavaGeneratorContext
	root: RootContext
	templates: EffectiveJavaJaxrsTemplates
}

/** The arguments to the {@link JavaJaxrsTemplates.inject} hook. */
export interface InjectParams {
	/** The interface type of the dependency. */
	interface: string
	/** A concrete class to instantiate inline, if there's no injection framework to supply the dependency. */
	class?: string
	/** The name of the instance variable. */
	name: string
	/** The field's access modifier; defaults to `private`. */
	access?: string
}

/**
 * Hook points that a child generator can override across this generator
 * family's templates: the model-emission templates (pojo/enum/interface/wrapper
 * and their nested forms) and the API templates (operations, services,
 * invokers and similar). Each hook mirrors a `hooks/*` Handlebars partial that
 * a child package previously overrode by supplying a same-named template
 * file; a child now supplies its replacement via the chained
 * {@link JavaGeneratorContext.templates} bag (see `chainJavaGeneratorContext`).
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

	/** Extra annotations on an operation method, in addition to the standard HTTP-method and `@Operation` ones. */
	apiMethodAnnotations?: (operation: CodegenOperation, ctx: JavaModelContext) => string | Skip
	/**
	 * The response built when bean validation finds that a request body required by
	 * `operation` is missing.
	 */
	beanValidationRequestBodyMissing?: (operation: CodegenOperation, ctx: JavaModelContext) => string
	/**
	 * The response built when bean validation finds constraint violations in a request
	 * body of `operation`.
	 */
	beanValidationViolation?: (operation: CodegenOperation, ctx: JavaModelContext) => string
	/** Extra annotations on the generated JAX-RS `Application` subclass. */
	invokerClassAnnotations?: (ctx: JavaModelContext) => string | Skip
	/**
	 * Declares and initialises an injected dependency field, honouring whichever
	 * dependency-injection approach (or lack of one) the generator uses.
	 */
	inject?: (params: InjectParams, ctx: JavaModelContext) => string

	/** Extra annotations on the generated API implementation class for `group`. */
	apiImplClassAnnotations?: (group: CodegenOperationGroup, ctx: JavaModelContext) => string | Skip
	/** Extra content in the body of the generated service-exception class for a non-default response of `operation`. */
	apiServiceException?: (operation: CodegenOperation, ctx: JavaModelContext) => string | Skip
	/** Extra annotations on the generated API service-implementation class for `group`. */
	apiServiceImplClassAnnotations?: (group: CodegenOperationGroup, ctx: JavaModelContext) => string | Skip
	/** The response built when bean validation finds that a required response body is missing. */
	beanValidationResponseMissing?: (response: CodegenResponse, ctx: JavaModelContext) => string
	/** The response built when bean validation finds constraint violations in a response body. */
	beanValidationResponseViolation?: (response: CodegenResponse, ctx: JavaModelContext) => string
	/** Extra annotations on the generated Jackson JAX-RS JSON provider class. */
	jaxbJsonProviderAnnotations?: (ctx: JavaModelContext) => string | Skip
	/** Extra `<properties>` entries in the generated `pom.xml`, one per line. */
	pomProperties?: (ctx: JavaModelContext) => string | Skip
	/** Extra `<dependency>` entries in the generated `pom.xml`, one per line. */
	pomDependencies?: (ctx: JavaModelContext) => string | Skip
	/** Extra `<dependency>` entries in the generated `pom.xml`'s `<dependencyManagement>`, one per line. */
	pomDependencyManagement?: (ctx: JavaModelContext) => string | Skip
	/** Extra content in the generated `pom.xml`'s `<build>`, after its `<plugins>`. */
	pomBuild?: (ctx: JavaModelContext) => string | Skip

	/** Extra constants in the generated `ApiConstants` interface, after the declared servers. */
	apiConstantsBody?: (ctx: JavaModelContext) => string | Skip
	/** Extra members of the generated `ApiInvoker` base interface. */
	apiInvokerInterfaceBody?: (ctx: JavaModelContext) => string | Skip
	/** Extra content before the generated API implementation class's declaration (e.g. its class-level documentation). */
	apiImplHeader?: (ctx: JavaModelContext) => string | Skip
	/** Extra members of the generated API implementation class for `group`, after its injected API client and before its operations. */
	apiImplClassBody?: (group: CodegenOperationGroup, ctx: JavaModelContext) => string | Skip

	/**
	 * Renders this generator's `pom.xml`. `java-jaxrs-common` has no Maven
	 * template of its own — every generator in this family supplies its own
	 * project layout — so this is unset until a child generator migrates its
	 * `pom.hbs` to TypeScript; while unset, the `pom.hbs` Handlebars partial a
	 * child generator loads is rendered instead.
	 */
	pom?: (ctx: JavaModelContext) => string
	/**
	 * Renders the generated (empty-bodied) test class for one operation group,
	 * when `includeTests` is enabled. Unset until a child generator migrates
	 * its `tests/apiTest.hbs` to TypeScript; while unset, that Handlebars
	 * partial is rendered instead, if the generator supplies one.
	 */
	apiTest?: (group: CodegenOperationGroup, ctx: JavaModelContext) => string
	/**
	 * Renders the JAX-RS client branch's whole `Api.java` interface for one
	 * operation group (the high-level, exception-throwing client interface a
	 * caller programs against). Unset until `java-jaxrs-client-generator`
	 * supplies its default; a descendant generator (e.g. one generating a
	 * different client library entirely) may override it wholesale.
	 */
	api?: (group: CodegenOperationGroup, ctx: JavaModelContext) => string
	/**
	 * Declares and initialises the field holding the low-level API client used by
	 * the generated API implementation class. Unset until
	 * `java-jaxrs-client-generator` supplies its default (which delegates to
	 * {@link JavaJaxrsTemplates.inject}); a descendant generator may override
	 * it to declare the field without delegating to `inject` at all.
	 */
	injectApi?: (group: CodegenOperationGroup, name: string, ctx: JavaModelContext) => string
}

/**
 * The effective hook bag passed to model-path templates: every model hook is
 * concrete (see {@link JavaJaxrsTemplates}), while the whole-file overrides
 * (`pom`, `apiTest`, `api`) and the JAX-RS client branch's `injectApi` stay
 * optional — their absence, rather than a no-op default, is what a call site
 * uses to decide whether to fall back to another rendering (or, for `pom`/
 * `apiTest`, whether to fall back to rendering the Handlebars template of the
 * same name).
 */
export type EffectiveJavaJaxrsTemplates = Required<Omit<JavaJaxrsTemplates, 'pom' | 'apiTest' | 'api' | 'injectApi'>> & Pick<JavaJaxrsTemplates, 'pom' | 'apiTest' | 'api' | 'injectApi'>
