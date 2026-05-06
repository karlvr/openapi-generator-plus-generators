import { CodegenGeneratorContext, CodegenOperation, CodegenOperationGroup, CodegenResponse, CodegenContent } from '@openapi-generator-plus/types'
import { ts, each, identifier, className, stringLiteral, isContentJson, isContentMultipart, isContentFormUrlEncoded, isArray, allProperties } from '@openapi-generator-plus/template-utils'
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
	const apiImports = hooks.apiImports?.(ctx as unknown as RootContext)
	const dateImport = ctx.dateApproach === 'blind-date'
		? "import { LocalDateString, LocalTimeString, LocalDateTimeString, OffsetDateTimeString } from 'blind-date';"
		: null

	const namespaceBody = each(ctx.group.operations, (op: AnnotatedOperation) => {
		const parts: string[] = []
		if (parameterCount(op.parameters) > 1) {
			parts.push(apiParametersInterface(generatorContext, op))
		}
		parts.push(apiResponseTypes(generatorContext, op))
		return parts.join('\n\n')
	}, '\n\n')

	const operations = each(ctx.group.operations, (op: AnnotatedOperation) => renderOperationFunction(generatorContext, ctx, op, hooks), '\n\n')

	const withConfigurationBody = each(ctx.group.operations, (op: AnnotatedOperation) => renderWithConfigurationEntry(generatorContext, op, groupName), '\n')

	const exportObjectEntries = each(ctx.group.operations, (op) => `${identifier(gen, op.name)}, `)

	return ts`${header(ctx)}

import { Configuration, getDefaultConfiguration } from "../configuration${ext}";
import { COLLECTION_FORMATS, encodeURIPathSegment, RequiredError, dateToString } from "../runtime${ext}";
import type { FetchArgs, UnauthorizedResponse, UndocumentedResponse, FetchErrorResponse } from "../runtime${ext}";
import { Api } from "../models${ext}";
${dateImport}
${apiImports || null}

namespace ${groupName}Api {
${namespaceBody}
}

${operations}

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
${withConfigurationBody}
	}
};

/**
 * Access all the endpoints in this group. Note that this will cause every endpoint to be included
 * in the resulting JavaScript bundle. To allow tree-shaking to remove unused endpoints, import the
 * specific endpoints from this file directly.
 */
const ${groupName}Api = {
	${exportObjectEntries}
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
		: each(op.parameters, (p) => `${renderParameter(generatorContext, p)}, `) ?? ''
	const reqBodyParam = op.requestBody?.nativeType ? `${renderParameter(generatorContext, op.requestBody)}, ` : ''

	const validateParams = each(op.parameters , (p) => validateParameter({ parameter: p, operation: op, parameterPrefix, generatorContext }), '\n')
	const validateBody = op.requestBody ? validateParameter({ parameter: op.requestBody, operation: op, parameterPrefix: '', generatorContext }) : null

	const pathReplacements = each(op.pathParams , (p) => `\t\t.replace('{${p.serializedName}}', encodeURIPathSegment(String(${parameterPrefix}${identifier(gen, p.name)})))`, '\n')

	const formParamsDecl = parameterCount(op.formParams) > 0 ? '\tconst localVarFormParams = new URLSearchParams();' : null
	const cookieParamsDecl = parameterCount(op.cookieParams) > 0 ? '\tconst localVarCookieParams = new URLSearchParams();' : null

	const securityBlock = apiSecurityRequirements(generatorContext, op) || null

	const queryAppends = each(op.queryParams , (p) => requestParameter({
		parameter: p as unknown as Parameters<typeof requestParameter>[0]['parameter'],
		dest: 'localVarQueryParameter',
		var: `${parameterPrefix}${identifier(gen, p.name)}`,
		dateApproach: ctx.dateApproach,
		generatorContext,
	}), '\n\n')

	const headerAppends = each(op.headerParams , (p) => requestParameter({
		parameter: p as unknown as Parameters<typeof requestParameter>[0]['parameter'],
		dest: 'localVarHeaderParameter',
		var: `${parameterPrefix}${identifier(gen, p.name)}`,
		dateApproach: ctx.dateApproach,
		generatorContext,
	}), '\n\n')

	let formBlock: string | null = null
	if (parameterCount(op.formParams) > 0) {
		const appends = each(op.formParams , (p) => requestParameter({
			parameter: p as unknown as Parameters<typeof requestParameter>[0]['parameter'],
			dest: 'localVarFormParams',
			var: `${parameterPrefix}${identifier(gen, p.name)}`,
			dateApproach: ctx.dateApproach,
			generatorContext,
		}), '\n\n')
		formBlock = `${appends}\n\tlocalVarHeaderParameter.set('Content-Type', 'application/x-www-form-urlencoded');`
	}

	let cookieBlock: string | null = null
	if (parameterCount(op.cookieParams) > 0) {
		const appends = each(op.cookieParams , (p) => requestParameter({
			parameter: p as unknown as Parameters<typeof requestParameter>[0]['parameter'],
			dest: 'localVarCookieParams',
			var: `${parameterPrefix}${identifier(gen, p.name)}`,
			dateApproach: ctx.dateApproach,
			generatorContext,
		}), '\n\n')
		cookieBlock = `${appends}\n\t/* NB: setting Cookies does not work in a browser, see https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_header_name */\n\tlocalVarHeaderParameter.set("Cookie", localVarCookieParams.toString().replace(/&/g, "; "));`
	}

	const requestBodyContentTypeBlock = renderRequestBodyContentTypeBlock(op.requestBody as RequestBodyShape | null)
	const requestBodyEncodingBlock = renderRequestBodyEncodingBlock(generatorContext, op, parameterPrefix)

	const responsesBlock = renderResponses(generatorContext, op, ctx.group, hooks)

	return ts`${operationDocumentation(generatorContext, op)}
export function ${identifier(gen, op.name)}ParamCreator(${paramDecls}${reqBodyParam}options: RequestInit = {}, configuration?: Configuration): FetchArgs {
	configuration ??= getDefaultConfiguration();

${validateParams || null}
${validateBody}

	let localVarPath = \`${ctx.path ?? ''}${op.path}\`${pathReplacements ? '\n' + pathReplacements : ''};
	const localVarPathQueryStart = localVarPath.indexOf("?");
	const localVarRequestOptions: RequestInit = Object.assign({ method: '${op.httpMethod}' }, options);
	const localVarHeaderParameter: Headers = options.headers ? new Headers(options.headers) : new Headers();
	const localVarQueryParameter = new URLSearchParams(localVarPathQueryStart !== -1 ? localVarPath.substring(localVarPathQueryStart + 1) : "");
	if (localVarPathQueryStart !== -1) {
		localVarPath = localVarPath.substring(0, localVarPathQueryStart);
	}
${formParamsDecl}
${cookieParamsDecl}

	${securityBlock}
${queryAppends || null}
${headerAppends || null}
${formBlock}
${cookieBlock}
${requestBodyContentTypeBlock}
	localVarRequestOptions.headers = localVarHeaderParameter;
${parameterCount(op.formParams) > 0 ? '\tlocalVarRequestOptions.body = localVarFormParams.toString();' : null}
${requestBodyEncodingBlock}

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
		const localVarFetchArgs = ${identifier(gen, op.name)}ParamCreator(${useInterface ? '__params, ' : each(op.parameters, (p) => `${identifier(gen, p.name)}, `) ?? ''}${op.requestBody?.nativeType ? `${identifier(gen, (op.requestBody as { name: string }).name)}, ` : ''}options, configuration);
		const response = await configuration.fetch(configuration.baseUri + localVarFetchArgs.url, localVarFetchArgs.options)
		const contentType = response.headers.get('Content-Type');
		const mimeType = contentType ? contentType.replace(/;.*/, '') : undefined;

${responsesBlock}
	} catch (error) {
		return {
			status: 'error',
			error,
		}
	}
}`
}

function renderResponses(generatorContext: CodegenGeneratorContext, op: AnnotatedOperation, group: CodegenOperationGroup, hooks: FetchClient2Hooks): string {
	const responseFn = hooks.apiResponseContent
		? (content: CodegenContent | null, response: CodegenResponse) => hooks.apiResponseContent!({ content, response, operation: op, group, rootContext: {} as RootContext, generatorContext })
		: (content: CodegenContent | null, response: CodegenResponse) => defaultApiResponseContent({ content, response, generatorContext })

	const documentedBranches = each(op.responses , (response: CodegenResponse) => {
		if (response.isCatchAll) {
			return null
		}
		const inner = response.contents
			? each(response.contents, (content) => ts`if (mimeType === ${stringLiteral(generatorContext, content.mediaType.mimeType)}) {
	${responseFn(content, response)}
}`, '\n')
			: responseFn(null, response)
		return ts`if (response.status === ${response.code}) {
	${inner}
}`
	}, '\n')

	let trailing: string
	if (op.catchAllResponse) {
		const cr = op.catchAllResponse
		trailing = ts`/* Catch-all response */
${cr.contents
	? each(cr.contents, (content) => ts`if (mimeType === ${stringLiteral(generatorContext, content.mediaType.mimeType)}) {
	${responseFn(content, cr)}
}`, '\n')
	: responseFn(null, cr)}`
	} else {
		trailing = ts`${op.addUnauthorizedResponseHandling ? `if (response.status === 401) {
	return {
		status: 'unauthorized',
		response,
	}
}
` : null}
return {
	status: 'undocumented',
	contentType: mimeType,
	response,
}`
	}

	return ts`${documentedBranches || null}
${trailing}`
}

function renderRequestBodyContentTypeBlock(rb: RequestBodyShape | null): string | null {
	if (!rb) {
		return null
	}
	const consumes = rb.consumes
	if (consumes && consumes.length > 0) {
		return `\tlocalVarHeaderParameter.set('Content-Type', '${consumes[0].mediaType}');`
	}
	return "\tlocalVarHeaderParameter.set('Content-Type', 'application/json');"
}

function renderRequestBodyEncodingBlock(generatorContext: CodegenGeneratorContext, op: AnnotatedOperation, _parameterPrefix: string): string | null {
	const rb = op.requestBody as RequestBodyShape | null
	if (!rb || !rb.nativeType) {
		return null
	}
	const gen = generatorContext.generator()
	const name = rb.name ?? 'body'
	const id = identifier(gen, name)
	const dc = rb.defaultContent

	let inner: string
	if (!dc) {
		inner = `localVarRequestOptions.body = ${id};`
	} else if (isContentFormUrlEncoded(dc)) {
		const props = allProperties(rb.schema!)
		const appends = each(props, (p) => requestParameter({
			parameter: p as unknown as Parameters<typeof requestParameter>[0]['parameter'],
			dest: 'localVarFormParams',
			var: `${id}["${p.serializedName}"]`,
			dateApproach: 'native',
			generatorContext,
		}), '\n')
		inner = ts`const localVarFormParams = new URLSearchParams();
${appends}
localVarRequestOptions.body = localVarFormParams;`
	} else if (isContentJson(dc)) {
		inner = `localVarRequestOptions.body = JSON.stringify(${id} || {});`
	} else if (isContentMultipart(dc)) {
		const encProps = rb.encoding?.properties
		const propLoops = encProps ? each(encProps, (encProp) => {
			const propName = encProp.property.serializedName
			const propIsArray = isArray(encProp.property)
			if (propIsArray) {
				return ts`if (${id}[${stringLiteral(generatorContext, propName)}] !== undefined) {
	for (const __anObject of ${id}.${identifier(gen, encProp.property.name)}${(encProp.property as { nullable?: boolean }).nullable ? ' || []' : ''}) {
		${multipartProperty({ encoding: encProp, propertyVar: '__anObject', bodyPartsVar: 'localVarFormData', generatorContext })}
	}
}`
			}
			return ts`if (${id}[${stringLiteral(generatorContext, propName)}] !== undefined) {
	${multipartProperty({ encoding: encProp, propertyVar: `${id}[${stringLiteral(generatorContext, propName)}]`, bodyPartsVar: 'localVarFormData', generatorContext })}
}`
		}, '\n') : ''
		inner = ts`const localVarFormData = new FormData();
${propLoops}
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
		: `${each(op.parameters, (p) => `${renderParameter(generatorContext, p)}, `) ?? ''}${op.requestBody?.nativeType ? `${renderParameter(generatorContext, op.requestBody)}, ` : ''}options?: RequestInit, configuration?: Configuration`
	const args = useInterface
		? `__params, ${op.requestBody?.nativeType ? `${identifier(gen, (op.requestBody as { name: string }).name)}, ` : ''}options, configuration ?? defaultConfiguration`
		: `${each(op.parameters, (p) => `${identifier(gen, p.name)}, `) ?? ''}${op.requestBody?.nativeType ? `${identifier(gen, (op.requestBody as { name: string }).name)}, ` : ''}options, configuration ?? defaultConfiguration`
	return `\t\t${identifier(gen, op.name)}: (${params}) => ${identifier(gen, op.name)}(${args}),`
}
