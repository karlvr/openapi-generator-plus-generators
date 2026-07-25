import { CodegenOperation, CodegenResponse } from '@openapi-generator-plus/types'
import { SKIP, ts, stringLiteral } from '@openapi-generator-plus/template-utils'
import { JavaJaxrsTemplates, EffectiveJavaJaxrsTemplates, InjectParams, JavaModelContext } from './types'
import { javax } from './helpers'

export { RootContext, JavaModelContext, JavaJaxrsTemplates, EffectiveJavaJaxrsTemplates, InjectParams } from './types'
export { pojo } from './pojo'
export { enumTemplate } from './enum'
export { interfaceTemplate } from './interface'
export { wrapper } from './wrapper'
export { validationRequest } from './validation/Request'
export { validationResponse } from './validation/Response'
export { noExplodeCollection } from './support/NoExplodeCollection'
export { noExplodeList } from './support/NoExplodeList'
export { noExplodeSet } from './support/NoExplodeSet'
export { noExplodeCollectionParamConverterProvider } from './provider/NoExplodeCollectionParamConverterProvider'
export { apiParams } from './apiParams'
export { imports } from './frag/imports'
export { operationAnnotations } from './frag/operationAnnotations'
export { operationDocumentation } from './frag/operationDocumentation'
export { operationVars, OperationVarsOptions, OperationVarsResult, BodyParamRenderer } from './frag/operationVars'
export { parameterAnnotations } from './frag/parameterAnnotations'
export { beanValidationValidateParams } from './frag/beanValidationValidateParams'
export { fromString } from './util/fromString'
export { javax, getter, setter, isNativeArray, isPrimitiveBool } from './helpers'
export { generatedAnnotation } from './generatedAnnotation'

/** The response built when bean validation finds a required response body missing. */
function beanValidationResponseMissing(response: CodegenResponse, ctx: JavaModelContext): string {
	return `throw new ${javax(ctx.root.useJakarta)}.ws.rs.InternalServerErrorException("Response body missing");`
}

/** The response built when bean validation finds constraint violations in a response. */
function beanValidationResponseViolation(response: CodegenResponse, ctx: JavaModelContext): string {
	const jx = javax(ctx.root.useJakarta)
	return ts`
throw new ${jx}.ws.rs.InternalServerErrorException("The server produced an invalid response:\\n  " + __validations.stream()
	.map(__v -> __v.getPropertyPath() + " " + __v.getMessage())
	.collect(java.util.stream.Collectors.joining("\\n  "))
);`
}

/** The response built when bean validation finds that a required request body is missing. */
function beanValidationRequestBodyMissing(operation: CodegenOperation, ctx: JavaModelContext): string {
	return `return __response.status(${javax(ctx.root.useJakarta)}.ws.rs.core.Response.Status.BAD_REQUEST).build();`
}

/** The response built when bean validation finds constraint violations in a request body. */
function beanValidationViolation(operation: CodegenOperation, ctx: JavaModelContext): string {
	const jx = javax(ctx.root.useJakarta)
	return ts`
return __response
	.status(${jx}.ws.rs.core.Response.Status.BAD_REQUEST)
	.type(${jx}.ws.rs.core.MediaType.TEXT_PLAIN_TYPE)
	.entity(__validations.stream()
		.map(__v -> __v.getPropertyPath() + " " + __v.getMessage())
		.collect(java.util.stream.Collectors.joining("\\n")))
	.build();`
}

/** Declares and initialises an injected dependency field; with no injection framework in play, a concrete class is instantiated inline. */
function inject(params: InjectParams): string {
	const access = params.access ?? 'private'
	const tail = params.class ? ` = new ${params.class}();` : '; // TODO a client implementation is required'
	return `${access} ${params.interface} ${params.name}${tail}`
}

/**
 * The default implementation of every model-path hook, matching the content
 * the original Handlebars extension partials rendered by default. A child
 * generator overrides individual entries via the chained
 * {@link JavaGeneratorContext.templates} bag (see `chainJavaGeneratorContext`
 * in the package's `index.ts`); this package merges its own defaults
 * underneath whatever the effective chain supplies.
 *
 * `pom` and `apiTest` are deliberately absent: this package has no default
 * for either (see {@link JavaJaxrsTemplates.pom}), so they're left unset
 * here and only appear in the effective bag once a child generator supplies
 * them.
 */
export const javaJaxrsCommonTemplates: EffectiveJavaJaxrsTemplates = {
	pojoHeader: () => SKIP,
	pojoFooter: () => SKIP,
	pojoHeaderAnnotations: () => SKIP,
	pojoPropertyAnnotations: (property, ctx) => `@com.fasterxml.jackson.annotation.JsonProperty(${stringLiteral(ctx.generatorContext, property.serializedName)})`,
	pojoImplementsExtras: () => SKIP,
	enumHeader: () => SKIP,
	enumFooter: () => SKIP,
	enumHeaderAnnotations: () => SKIP,
	wrapperHeaderAnnotations: () => SKIP,
	beanValidationAnnotationProperties: () => SKIP,

	apiMethodAnnotations: () => SKIP,
	beanValidationRequestBodyMissing,
	beanValidationViolation,
	invokerClassAnnotations: () => SKIP,
	inject: (params) => inject(params),

	apiImplClassAnnotations: () => SKIP,
	apiServiceException: () => SKIP,
	apiServiceImplClassAnnotations: () => SKIP,
	beanValidationResponseMissing,
	beanValidationResponseViolation,
	jaxbJsonProviderAnnotations: () => SKIP,
	pomProperties: () => SKIP,
}
