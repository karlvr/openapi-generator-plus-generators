import { CodegenGeneratorContext, CodegenOperationGroup, CodegenParameter, CodegenResponse, CodegenContent } from '@openapi-generator-plus/types'
import { ts, each, identifier, className, stringLiteral, isContentJson, isContentMultipart, isContentFormUrlEncoded, isArray, allProperties, SKIP, Skip, when, maybe, indent } from '@openapi-generator-plus/template-utils'
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
	${each(ctx.group.operations, (op: AnnotatedOperation) => `${when(parameterCount(op.parameters) > 1, () => `${apiParametersInterface(generatorContext, op)}\n\n`)}${apiResponseTypes(generatorContext, op)}\n`, '\n')}
}

${each(ctx.group.operations, (op: AnnotatedOperation) => renderParamCreatorFunction(generatorContext, ctx, op), '\n')}

/**
 * ${groupName}Api - parameter creator
 * @export
 */
export function paramCreator(configuration?: Configuration) {
	configuration ??= getDefaultConfiguration();

	return {

	}
};

${each(ctx.group.operations, (op: AnnotatedOperation) => renderOperationFunction(generatorContext, ctx, op, hooks), '\n')}

/**
 * Creates a version of the API where the specified configuration is the default for all operations.
 * @export
 */
export function withConfiguration(defaultConfiguration: Configuration) {
	return {
		${each(ctx.group.operations, (op: AnnotatedOperation) => ts`${operationDocumentation(generatorContext, op)}
${identifier(gen, op.name)}: (${parameterList(generatorContext, op, groupName)}options?: RequestInit, configuration?: Configuration) => ${identifier(gen, op.name)}(${argumentList(generatorContext, op)}options, configuration ?? defaultConfiguration),`, '\n')}
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

/**
 * Renders the leading parameter declarations shared by an operation's functions: the
 * operation's parameters (or parameters-interface) and request body, each followed by ', '.
 */
function parameterList(generatorContext: CodegenGeneratorContext, op: AnnotatedOperation, groupName: string): string {
	const gen = generatorContext.generator()
	const requestBodyParam = op.requestBody?.nativeType ? `${renderParameter(generatorContext, op.requestBody)}, ` : ''
	if (parameterCount(op.parameters) > 1) {
		return `__params: ${groupName}Api.${className(gen, `${op.name}_parameters`)}, ${requestBodyParam}`
	}
	return `${each(op.parameters, (p) => `${renderParameter(generatorContext, p)}, `)}${requestBodyParam}`
}

/**
 * Renders the leading arguments for a call to an operation's functions, mirroring
 * {@link parameterList}.
 */
function argumentList(generatorContext: CodegenGeneratorContext, op: AnnotatedOperation): string {
	const gen = generatorContext.generator()
	const requestBodyArg = op.requestBody?.nativeType ? `${identifier(gen, (op.requestBody as { name: string }).name)}, ` : ''
	if (parameterCount(op.parameters) > 1) {
		return `__params, ${requestBodyArg}`
	}
	return `${each(op.parameters, (p) => `${identifier(gen, p.name)}, `)}${requestBodyArg}`
}

function renderParamCreatorFunction(generatorContext: CodegenGeneratorContext, ctx: ApiTemplateContext, op: AnnotatedOperation): string {
	const gen = generatorContext.generator()
	const useInterface = parameterCount(op.parameters) > 1
	const parameterPrefix = useInterface ? '__params.' : ''
	const groupName = className(gen, ctx.group.name)

	/* Renders the code that appends a parameter value to the given destination collection. */
	const appendParameter = (p: CodegenParameter, dest: string) => requestParameter({
		parameter: p as unknown as Parameters<typeof requestParameter>[0]['parameter'],
		dest,
		var: `${parameterPrefix}${identifier(gen, p.name)}`,
		dateApproach: ctx.dateApproach,
		generatorContext,
	})

	return ts`${operationDocumentation(generatorContext, op)}
export function ${identifier(gen, op.name)}ParamCreator(${parameterList(generatorContext, op, groupName)}options: RequestInit = {}, configuration?: Configuration): FetchArgs {
	configuration ??= getDefaultConfiguration();

	${each(op.parameters, (p) => validateParameter({ parameter: p, operation: op, parameterPrefix, generatorContext }), '\n')}
	${maybe(op.requestBody && validateParameter({ parameter: op.requestBody, operation: op, parameterPrefix: '', generatorContext }))}

	let localVarPath = \`${ctx.group.path ?? ''}${op.path}\`${when(parameterCount(op.pathParams) > 0, () => `\n${each(op.pathParams, (p) => `\t\t.replace('{${p.serializedName}}', encodeURIPathSegment(String(${parameterPrefix}${identifier(gen, p.name)})))`, '\n')}`)};
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
${each(op.queryParams, (p) => `${indent(appendParameter(p, 'localVarQueryParameter'), '\t')}\n`, '\n')}
${each(op.headerParams, (p) => `${indent(appendParameter(p, 'localVarHeaderParameter'), '\t')}\n`, '\n')}
${when(parameterCount(op.formParams) > 0, () => `${each(op.formParams, (p) => `${indent(appendParameter(p, 'localVarFormParams'), '\t')}\n`, '\n')}
	localVarHeaderParameter.set('Content-Type', 'application/x-www-form-urlencoded');
`)}
${when(parameterCount(op.cookieParams) > 0, () => `${each(op.cookieParams, (p) => `${indent(appendParameter(p, 'localVarCookieParams'), '\t')}\n`, '\n')}
	/* NB: setting Cookies does not work in a browser, see https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_header_name */
	localVarHeaderParameter.set("Cookie", localVarCookieParams.toString().replace(/&/g, "; "));
`)}
${maybe(op.requestBody, rb => `${renderRequestBodyContentTypeBlock(rb as RequestBodyShape)}\n`)}
	localVarRequestOptions.headers = localVarHeaderParameter;
${when(parameterCount(op.formParams) > 0, '\tlocalVarRequestOptions.body = localVarFormParams.toString();')}
${renderRequestBodyEncodingBlock(generatorContext, ctx, op)}

	const localVarQueryParameterString = localVarQueryParameter.toString();
	if (localVarQueryParameterString) {
		localVarPath += "?" + localVarQueryParameterString;
	}
	return {
		url: localVarPath,
		options: localVarRequestOptions,
	};
}`
}

function renderOperationFunction(generatorContext: CodegenGeneratorContext, ctx: ApiTemplateContext, op: AnnotatedOperation, hooks: FetchClient2Hooks): string {
	const gen = generatorContext.generator()
	const groupName = className(gen, ctx.group.name)

	return ts`${operationDocumentation(generatorContext, op)}
export async function ${identifier(gen, op.name)}(${parameterList(generatorContext, op, groupName)}options?: RequestInit, configuration?: Configuration): Promise<${groupName}Api.${className(gen, op.name)}Response> {
	try {
		configuration ??= getDefaultConfiguration();
		const localVarFetchArgs = ${identifier(gen, op.name)}ParamCreator(${argumentList(generatorContext, op)}options, configuration);
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
${contentBranches(op.catchAllResponse)}` : ts`

${when(op.addUnauthorizedResponseHandling, () => `if (response.status === 401) {
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

function renderRequestBodyContentTypeBlock(rb: RequestBodyShape): string {
	const consumes = rb.consumes
	if (consumes && consumes.length > 0) {
		return `\tlocalVarHeaderParameter.set('Content-Type', '${consumes[0].mediaType}');`
	}
	return "\tlocalVarHeaderParameter.set('Content-Type', 'application/json');"
}

function renderRequestBodyEncodingBlock(generatorContext: CodegenGeneratorContext, ctx: ApiTemplateContext, op: AnnotatedOperation): string | Skip {
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
	parameter: { ...p, encoding: dc.encoding ? idx.get(dc.encoding.properties, p.name) : null } as unknown as Parameters<typeof requestParameter>[0]['parameter'],
	dest: 'localVarFormParams',
	var: `${id}["${p.serializedName}"]`,
	dateApproach: ctx.dateApproach,
	generatorContext,
}), '\n')}
localVarRequestOptions.body = localVarFormParams;`
	} else if (isContentJson(dc)) {
		inner = `localVarRequestOptions.body = JSON.stringify(${id} || {});`
	} else if (isContentMultipart(dc)) {
		inner = ts`const localVarFormData = new FormData();
${each(dc.encoding?.properties, (encProp) => {
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
}, '\n')}
localVarRequestOptions.body = localVarFormData;`
	} else {
		inner = `localVarRequestOptions.body = ${id};`
	}

	return ts`

	if (${id} !== undefined) {
		${inner}
	}`
}
