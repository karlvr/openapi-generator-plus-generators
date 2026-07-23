import { CodegenGeneratorContext, CodegenOperationGroup, CodegenParameter, CodegenResponse, CodegenContent } from '@openapi-generator-plus/types'
import { ts, each, identifier, className, stringLiteral, isContentJson, isContentMultipart, isContentFormUrlEncoded, isArray, allProperties, SKIP, Skip, when, maybe, join } from '@openapi-generator-plus/template-utils'
import * as idx from '@openapi-generator-plus/indexed-type'
import { header } from './header'
import { parameter as renderParameter } from './frag/parameter'
import { validateParameter } from './frag/validateParameter'
import { apiSecurityRequirements } from './frag/apiSecurityRequirements'
import { apiParametersInterface } from './frag/apiParametersInterface'
import { apiResponseTypes } from './frag/apiResponseTypes'
import { requestParameter } from './frag/requestParameter'
import { multipartProperty } from './frag/multipartProperty'
import { operationDocumentation } from './frag/operationDocumentation'
import { apiResponseContent as defaultApiResponseContent } from './frag/apiResponseContent'
import { AnnotatedOperation, DocumentContext, FetchClient2Hooks, RootContext } from './types'

function parameterCount(coll: Record<string, unknown> | null | undefined): number {
	return coll ? idx.size(coll) : 0
}

export interface ApiTemplateContext extends DocumentContext {
	/** The group being rendered. */
	group: CodegenOperationGroup
}

interface RequestBodyShape {
	nativeType?: { nativeType: string } | string | null
	consumes?: Array<{ mediaType: string }> | null
	defaultContent?: CodegenContent | null
	encoding?: { properties?: import('@openapi-generator-plus/types').IndexedCollectionType<import('@openapi-generator-plus/types').CodegenContentPropertyEncoding> } | null
	schema?: import('@openapi-generator-plus/types').CodegenObjectSchema | null
	name?: string
}

/**
 * Render a single `api/<group>.ts` file. The caller picks one group per file.
 */
export function api(generatorContext: CodegenGeneratorContext, ctx: ApiTemplateContext, hooks: FetchClient2Hooks): string {
	const ext = ctx.esm ? '.js' : ''
	const gen = generatorContext.generator()
	const groupName = className(gen, ctx.group.name)

	return ts`${header(ctx)}

import { Configuration, getDefaultConfiguration } from "../configuration${ext}";
import { COLLECTION_FORMATS, encodeURIPathSegment, RequiredError, dateToString } from "../runtime${ext}";
import type { FetchArgs, UnauthorizedResponse, UndocumentedResponse, FetchErrorResponse } from "../runtime${ext}";
import { Api } from "../models${ext}";
${when(ctx.dateApproach === 'blind-date',
	"import { LocalDateString, LocalTimeString, LocalDateTimeString, OffsetDateTimeString } from 'blind-date';")}
${maybe(hooks.apiImports?.(ctx as unknown as RootContext))}

namespace ${groupName}Api {
${each(ctx.group.operations, (op: AnnotatedOperation) => join([
	when(parameterCount(op.parameters) > 1, () => apiParametersInterface(generatorContext, op)),
	apiResponseTypes(generatorContext, op),
], '\n\n'), '\n\n')}
}

${each(ctx.group.operations, (op: AnnotatedOperation) => renderOperationFunction(generatorContext, ctx, op, hooks), '\n\n')}

/**
 * ${groupName}Api - parameter creator
 * @export
 */
export function paramCreator(configuration?: Configuration) {
	configuration ??= getDefaultConfiguration();

	return {

	}
};

/**
 * Creates a version of the API where the specified configuration is the default for all operations.
 * @export
 */
export function withConfiguration(defaultConfiguration: Configuration) {
	return {
${each(ctx.group.operations, (op: AnnotatedOperation) => renderWithConfigurationEntry(generatorContext, op, groupName), '\n')}
	}
};

/**
 * Access all the endpoints in this group. Note that this will cause every endpoint to be included
 * in the resulting JavaScript bundle. To allow tree-shaking to remove unused endpoints, import the
 * specific endpoints from this file directly.
 */
const ${groupName}Api = {
	${each(ctx.group.operations, (op) => `${identifier(gen, op.name)}, `)}
};

export default ${groupName}Api;
`
}

function renderOperationFunction(generatorContext: CodegenGeneratorContext, ctx: ApiTemplateContext, op: AnnotatedOperation, hooks: FetchClient2Hooks): string {
	const gen = generatorContext.generator()
	const parametersInterfaceName = className(gen, `${op.name}_parameters`)
	const useInterface = parameterCount(op.parameters) > 1
	const parameterPrefix = useInterface ? '__params.' : ''
	const groupName = className(gen, ctx.group.name)

	const paramDecls = useInterface
		? `__params: ${groupName}Api.${parametersInterfaceName}, `
		: each(op.parameters, (p) => `${renderParameter(generatorContext, p)}, `)
	const reqBodyParam = op.requestBody?.nativeType ? `${renderParameter(generatorContext, op.requestBody)}, ` : ''

	/* Renders the code that appends a parameter value to the given destination collection. */
	const appendParameter = (p: CodegenParameter, dest: string) => requestParameter({
		parameter: p as unknown as Parameters<typeof requestParameter>[0]['parameter'],
		dest,
		var: `${parameterPrefix}${identifier(gen, p.name)}`,
		dateApproach: ctx.dateApproach,
		generatorContext,
	})

	const pathReplacements = each(op.pathParams, (p) => `\t\t.replace('{${p.serializedName}}', encodeURIPathSegment(String(${parameterPrefix}${identifier(gen, p.name)})))`, '\n')

	return ts`${operationDocumentation(generatorContext, op)}
export function ${identifier(gen, op.name)}ParamCreator(${paramDecls}${reqBodyParam}options: RequestInit = {}, configuration?: Configuration): FetchArgs {
	configuration ??= getDefaultConfiguration();

${each(op.parameters, (p) => validateParameter({ parameter: p, operation: op, parameterPrefix, generatorContext }), '\n')}
${maybe(op.requestBody, rb => validateParameter({ parameter: rb, operation: op, parameterPrefix: '', generatorContext }))}

	let localVarPath = \`${ctx.path ?? ''}${op.path}\`${pathReplacements ? '\n' + pathReplacements : ''};
	const localVarPathQueryStart = localVarPath.indexOf("?");
	const localVarRequestOptions: RequestInit = Object.assign({ method: '${op.httpMethod}' }, options);
	const localVarHeaderParameter: Headers = options.headers ? new Headers(options.headers) : new Headers();
	const localVarQueryParameter = new URLSearchParams(localVarPathQueryStart !== -1 ? localVarPath.substring(localVarPathQueryStart + 1) : "");
	if (localVarPathQueryStart !== -1) {
		localVarPath = localVarPath.substring(0, localVarPathQueryStart);
	}
${when(parameterCount(op.formParams) > 0, '\tconst localVarFormParams = new URLSearchParams();')}
${when(parameterCount(op.cookieParams) > 0, '\tconst localVarCookieParams = new URLSearchParams();')}

	${apiSecurityRequirements(generatorContext, op)}
${each(op.queryParams, (p) => appendParameter(p, 'localVarQueryParameter'), '\n\n')}
${each(op.headerParams, (p) => appendParameter(p, 'localVarHeaderParameter'), '\n\n')}
${when(parameterCount(op.formParams) > 0, () => `${each(op.formParams, (p) => appendParameter(p, 'localVarFormParams'), '\n\n')}
	localVarHeaderParameter.set('Content-Type', 'application/x-www-form-urlencoded');`)}
${when(parameterCount(op.cookieParams) > 0, () => `${each(op.cookieParams, (p) => appendParameter(p, 'localVarCookieParams'), '\n\n')}
	/* NB: setting Cookies does not work in a browser, see https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_header_name */
	localVarHeaderParameter.set("Cookie", localVarCookieParams.toString().replace(/&/g, "; "));`)}
${renderRequestBodyContentTypeBlock(op.requestBody as RequestBodyShape | null)}
	localVarRequestOptions.headers = localVarHeaderParameter;
${when(parameterCount(op.formParams) > 0, '\tlocalVarRequestOptions.body = localVarFormParams.toString();')}
${renderRequestBodyEncodingBlock(generatorContext, op, parameterPrefix)}

	const localVarQueryParameterString = localVarQueryParameter.toString();
	if (localVarQueryParameterString) {
		localVarPath += "?" + localVarQueryParameterString;
	}
	return {
		url: localVarPath,
		options: localVarRequestOptions,
	};
}

${operationDocumentation(generatorContext, op)}
export async function ${identifier(gen, op.name)}(${paramDecls}${reqBodyParam}options?: RequestInit, configuration?: Configuration): Promise<${groupName}Api.${className(gen, op.name)}Response> {
	try {
		configuration ??= getDefaultConfiguration();
		const localVarFetchArgs = ${identifier(gen, op.name)}ParamCreator(${useInterface ? '__params, ' : each(op.parameters, (p) => `${identifier(gen, p.name)}, `)}${op.requestBody?.nativeType ? `${identifier(gen, (op.requestBody as { name: string }).name)}, ` : ''}options, configuration);
		const response = await configuration.fetch(configuration.baseUri + localVarFetchArgs.url, localVarFetchArgs.options)
		const contentType = response.headers.get('Content-Type');
		const mimeType = contentType ? contentType.replace(/;.*/, '') : undefined;

${renderResponses(generatorContext, ctx, op, hooks)}
	} catch (error) {
		return {
			status: 'error',
			error,
		}
	}
}`
}

function renderResponses(generatorContext: CodegenGeneratorContext, ctx: ApiTemplateContext, op: AnnotatedOperation, hooks: FetchClient2Hooks): string {
	const group = ctx.group
	const responseFn = hooks.apiResponseContent
		? (content: CodegenContent | null, response: CodegenResponse) => hooks.apiResponseContent!({ content, response, operation: op, group, rootContext: ctx as unknown as RootContext, generatorContext })
		: (content: CodegenContent | null, response: CodegenResponse) => defaultApiResponseContent({ content, response, dateApproach: ctx.dateApproach, generatorContext })

	/* Renders the mime-type dispatch for a response's contents, or the no-content body. */
	const contentBranches = (response: CodegenResponse) => response.contents
		? each(response.contents, (content) => ts`if (mimeType === ${stringLiteral(generatorContext, content.mediaType.mimeType)}) {
	${responseFn(content, response)}
}`, '\n')
		: responseFn(null, response)

	return ts`${each(op.responses, (response: CodegenResponse) => when(!response.isCatchAll, () => ts`if (response.status === ${String(response.code)}) {
	${contentBranches(response)}
}`), '\n')}
${op.catchAllResponse ? ts`/* Catch-all response */
${contentBranches(op.catchAllResponse)}` : ts`${when(op.addUnauthorizedResponseHandling, () => `if (response.status === 401) {
	return {
		status: 'unauthorized',
		response,
	}
}
`)}
return {
	status: 'undocumented',
	contentType: mimeType,
	response,
}`}`
}

function renderRequestBodyContentTypeBlock(rb: RequestBodyShape | null): string | Skip {
	if (!rb) {
		return SKIP
	}
	const consumes = rb.consumes
	if (consumes && consumes.length > 0) {
		return `\tlocalVarHeaderParameter.set('Content-Type', '${consumes[0].mediaType}');`
	}
	return "\tlocalVarHeaderParameter.set('Content-Type', 'application/json');"
}

function renderRequestBodyEncodingBlock(generatorContext: CodegenGeneratorContext, op: AnnotatedOperation, _parameterPrefix: string): string | Skip {
	const rb = op.requestBody as RequestBodyShape | null
	if (!rb || !rb.nativeType) {
		return SKIP
	}
	const gen = generatorContext.generator()
	const name = rb.name ?? 'body'
	const id = identifier(gen, name)
	const dc = rb.defaultContent

	let inner: string
	if (!dc) {
		inner = `localVarRequestOptions.body = ${id};`
	} else if (isContentFormUrlEncoded(dc)) {
		inner = ts`const localVarFormParams = new URLSearchParams();
${each(allProperties(rb.schema!), (p) => requestParameter({
	parameter: p as unknown as Parameters<typeof requestParameter>[0]['parameter'],
	dest: 'localVarFormParams',
	var: `${id}["${p.serializedName}"]`,
	dateApproach: 'native',
	generatorContext,
}), '\n')}
localVarRequestOptions.body = localVarFormParams;`
	} else if (isContentJson(dc)) {
		inner = `localVarRequestOptions.body = JSON.stringify(${id} || {});`
	} else if (isContentMultipart(dc)) {
		const encProps = rb.encoding?.properties
		inner = ts`const localVarFormData = new FormData();
${encProps ? each(encProps, (encProp) => {
	const propName = encProp.property.serializedName
	if (isArray(encProp.property)) {
		return ts`if (${id}[${stringLiteral(generatorContext, propName)}] !== undefined) {
	for (const __anObject of ${id}.${identifier(gen, encProp.property.name)}${(encProp.property as { nullable?: boolean }).nullable ? ' || []' : ''}) {
		${multipartProperty({ encoding: encProp, propertyVar: '__anObject', bodyPartsVar: 'localVarFormData', generatorContext })}
	}
}`
	}
	return ts`if (${id}[${stringLiteral(generatorContext, propName)}] !== undefined) {
	${multipartProperty({ encoding: encProp, propertyVar: `${id}[${stringLiteral(generatorContext, propName)}]`, bodyPartsVar: 'localVarFormData', generatorContext })}
}`
}, '\n') : ''}
localVarRequestOptions.body = localVarFormData;`
	} else {
		inner = `localVarRequestOptions.body = ${id};`
	}

	return ts`
	if (${id} !== undefined) {
		${inner}
	}`
}

function renderWithConfigurationEntry(generatorContext: CodegenGeneratorContext, op: AnnotatedOperation, groupName: string): string {
	const gen = generatorContext.generator()
	const useInterface = parameterCount(op.parameters) > 1
	const params = useInterface
		? `__params: ${groupName}Api.${className(gen, op.name + '_parameters')}, ${op.requestBody?.nativeType ? `${renderParameter(generatorContext, op.requestBody)}, ` : ''}options?: RequestInit, configuration?: Configuration`
		: `${each(op.parameters, (p) => `${renderParameter(generatorContext, p)}, `)}${op.requestBody?.nativeType ? `${renderParameter(generatorContext, op.requestBody)}, ` : ''}options?: RequestInit, configuration?: Configuration`
	const args = useInterface
		? `__params, ${op.requestBody?.nativeType ? `${identifier(gen, (op.requestBody as { name: string }).name)}, ` : ''}options, configuration ?? defaultConfiguration`
		: `${each(op.parameters, (p) => `${identifier(gen, p.name)}, `)}${op.requestBody?.nativeType ? `${identifier(gen, (op.requestBody as { name: string }).name)}, ` : ''}options, configuration ?? defaultConfiguration`
	return `\t\t${identifier(gen, op.name)}: (${params}) => ${identifier(gen, op.name)}(${args}),`
}
