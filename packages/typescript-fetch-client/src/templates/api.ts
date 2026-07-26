import { CodegenGeneratorContext, CodegenObjectSchema, CodegenOperation, CodegenOperationGroup, CodegenParameter, CodegenRequestBody, CodegenResponse, CodegenContent, CodegenSecurityScheme, CodegenAuthScope } from '@openapi-generator-plus/types'
import { ts, each, identifier, className, stringLiteral, capitalize, isContentJson, isContentMultipart, isContentFormUrlEncoded, isArray, allProperties, SKIP, Skip, when, maybe, indent } from '@openapi-generator-plus/template-utils'
import * as idx from '@openapi-generator-plus/indexed-type'
import { header } from './header'
import { parameter as renderParameter } from './frag/parameter'
import { validateParameter } from './frag/validateParameter'
import { requestParameter } from './frag/requestParameter'
import { multipartProperty } from './frag/multipartProperty'
import { operationDocumentation } from './frag/operationDocumentation'
import { apiResponseContent as defaultApiResponseContent } from './frag/apiResponseContent'
import { DateApproach } from '@openapi-generator-plus/typescript-generator-common'
import { DocumentContext, FetchClientHooks } from './types'

function parameterCount(coll: Record<string, unknown> | null | undefined): number {
	return coll ? idx.size(coll) : 0
}

/**
 * Render the whole `api.ts` output file: one file containing every operation
 * group's fetch-parameter-creator, functional, factory, (optional interface),
 * and class-based API surfaces.
 */
export function api(generatorContext: CodegenGeneratorContext, ctx: DocumentContext, hooks: FetchClientHooks): string {
	return ts`
${header(ctx)}

import { Configuration } from "./configuration";
import { BASE_PATH, COLLECTION_FORMATS, encodeURIPathSegment, FetchAPI, FetchArgs, BaseAPI, RequiredError, defaultFetch } from "./runtime";
import { ${ctx.apiNamespace} } from "./models";
${when(ctx.dateApproach === DateApproach.BlindDate,
		'import { LocalDateString, LocalTimeString, LocalDateTimeString, OffsetDateTimeString } from \'blind-date\';')}
${maybe(hooks.apiImports?.(ctx))}

export type FactoryFunction<T> = (configuration?: Configuration, basePath?: string, fetch?: FetchAPI) => T;

${each(ctx.groups, (group) => renderGroup(generatorContext, ctx, group, hooks))}
${when(ctx.groups.length === 0, '')}
/**
 * We sometimes represent dates as strings (in models) and as Dates (in parameters) so this
 * function converts them both to a string.
 */
function dateToString(value: Date | string): string

/**
 * We sometimes represent dates as strings (in models) and as Dates (in parameters) so this
 * function converts them both to a string.
 */
function dateToString(value: Date | string | undefined): string | undefined {
	if (value instanceof Date) {
		return value.toISOString();
	} else if (typeof value === 'string') {
		return value;
	} else {
		return undefined;
	}
}
`
}

/**
 * Render one operation group's full API surface: the fetch-parameter-creator,
 * the functional (`Fp`) wrapper, the factory function, an optional interface
 * (behind `withInterfaces`), and the object-oriented class.
 */
function renderGroup(generatorContext: CodegenGeneratorContext, ctx: DocumentContext, group: CodegenOperationGroup, hooks: FetchClientHooks): string {
	const gen = generatorContext.generator()
	const groupName = className(gen, group.name)
	const withInterfaces = ctx.withInterfaces

	const interfaceBlock = withInterfaces ? ts`
/**
 * ${groupName}Api - interface
 * @export
 * @interface ${groupName}Api
 */
export interface ${groupName}ApiInterface {
	${each(group.operations, (op) => renderInterfaceMethod(generatorContext, op), '\n')}
}

` : ''

	return ts`
/**
 * ${groupName}Api - fetch parameter creator
 * @export
 */
export const ${groupName}ApiFetchParamCreator = function (configuration?: Configuration) {
	return {
		${each(group.operations, (op) => renderParamCreatorMethod(generatorContext, ctx, group, op), '\n')}
	}
};

/**
 * ${groupName}Api - functional programming interface
 * @export
 */
export const ${groupName}ApiFp = function(configuration?: Configuration) {
	return {
		${each(group.operations, (op) => renderFpMethod(generatorContext, ctx, group, op, hooks), '\n')}
	}
};

/**
 * ${groupName}Api - factory interface
 * @export
 */
export const ${groupName}ApiFactory: FactoryFunction<${groupName}Api${withInterfaces ? 'Interface' : ''}> = function (configuration?: Configuration, basePath?: string, fetch?: FetchAPI) {
	return new ${groupName}Api(configuration, basePath, fetch);
};

${interfaceBlock}/**
 * ${groupName}Api - object-oriented interface
 * @export
 * @class ${groupName}Api
 * @extends {BaseAPI}
 */
export class ${groupName}Api extends BaseAPI${withInterfaces ? ` implements ${groupName}ApiInterface` : ''} {
	${each(group.operations, (op) => renderClassMethod(generatorContext, group, op), '\n')}
}
`
}

/**
 * Renders the leading parameter declarations shared by an operation's
 * functions: the operation's parameters and request body, each followed by
 * `, `.
 */
function parameterList(generatorContext: CodegenGeneratorContext, op: CodegenOperation): string {
	const requestBodyParam = op.requestBody?.nativeType ? `${renderParameter(generatorContext, op.requestBody)}, ` : ''
	return `${each(op.parameters, (p) => `${renderParameter(generatorContext, p)}, `)}${requestBodyParam}`
}

/**
 * Renders the leading arguments for a call to an operation's functions,
 * mirroring {@link parameterList}.
 */
function argumentList(generatorContext: CodegenGeneratorContext, op: CodegenOperation): string {
	const gen = generatorContext.generator()
	const requestBodyArg = op.requestBody?.nativeType ? `${identifier(gen, op.requestBody.name)}, ` : ''
	return `${each(op.parameters, (p) => `${identifier(gen, p.name)}, `)}${requestBodyArg}`
}

function renderInterfaceMethod(generatorContext: CodegenGeneratorContext, op: CodegenOperation): string {
	const gen = generatorContext.generator()
	return ts`
${operationDocumentation(generatorContext, op)}
${identifier(gen, op.name)}(${each(op.parameters, (p) => `${identifier(gen, p.name)}: ${p.nativeType}${p.required ? '' : ' | undefined'}, `)}${op.requestBody?.nativeType ? `${identifier(gen, op.requestBody.name)}: ${op.requestBody.nativeType}${op.requestBody.required ? '' : ' | undefined'}, ` : ''}options?: RequestInit): Promise<${op.returnNativeType ?? '{}'}>;
`
}

function renderClassMethod(generatorContext: CodegenGeneratorContext, group: CodegenOperationGroup, op: CodegenOperation): string {
	const gen = generatorContext.generator()
	const groupName = className(gen, group.name)
	return ts`
${operationDocumentation(generatorContext, op)}
public ${identifier(gen, op.name)}(${parameterList(generatorContext, op)}options?: RequestInit) {
	return ${groupName}ApiFp(this.configuration).${identifier(gen, op.name)}(${argumentList(generatorContext, op)}options)(this.fetch, this.basePath);
}
`
}

function renderParamCreatorMethod(generatorContext: CodegenGeneratorContext, ctx: DocumentContext, group: CodegenOperationGroup, op: CodegenOperation): string {
	const gen = generatorContext.generator()

	/* Renders the code that appends a parameter value to the given destination collection. */
	const appendParameter = (p: CodegenParameter, dest: string) => requestParameter({
		parameter: p,
		dest,
		var: identifier(gen, p.name),
		dateApproach: ctx.dateApproach,
		generatorContext,
	})

	return ts`
${operationDocumentation(generatorContext, op)}
${identifier(gen, op.name)}(${parameterList(generatorContext, op)}options: RequestInit = {}): FetchArgs {
	${each(op.parameters, (p) => validateParameter({ parameter: p, operation: op, generatorContext }), '\n')}
	${op.requestBody ? validateParameter({ parameter: op.requestBody, operation: op, generatorContext }) : SKIP}
	let localVarPath = \`${group.path ?? ''}${op.path}\`${each(op.pathParams, (p) => `\n\t\t.replace('{${p.serializedName}}', encodeURIPathSegment(String(${identifier(gen, p.name)})))`)};
	const localVarPathQueryStart = localVarPath.indexOf("?");
	const localVarRequestOptions: RequestInit = Object.assign({ method: '${op.httpMethod}' }, options);
	const localVarHeaderParameter: Headers = options.headers ? new Headers(options.headers) : new Headers();
	const localVarQueryParameter = new URLSearchParams(localVarPathQueryStart !== -1 ? localVarPath.substring(localVarPathQueryStart + 1) : "");
	if (localVarPathQueryStart !== -1) {
		localVarPath = localVarPath.substring(0, localVarPathQueryStart);
	}
${when(parameterCount(op.formParams) > 0, '\tconst localVarFormParams = new URLSearchParams();')}
${when(parameterCount(op.cookieParams) > 0, '\tconst localVarCookieParams = new URLSearchParams();')}

	${renderSecurityRequirements(generatorContext, op)}
${each(op.queryParams, (p) => `${indent(appendParameter(p, 'localVarQueryParameter'), '\t')}\n`, '\n')}
${each(op.headerParams, (p) => `${indent(appendParameter(p, 'localVarHeaderParameter'), '\t')}\n`, '\n')}
${when(parameterCount(op.formParams) > 0, () => `${each(op.formParams, (p) => `${indent(appendParameter(p, 'localVarFormParams'), '\t')}\n`, '\n')}
	localVarHeaderParameter.set('Content-Type', 'application/x-www-form-urlencoded');
`)}
${when(parameterCount(op.cookieParams) > 0, () => `${each(op.cookieParams, (p) => `${indent(appendParameter(p, 'localVarCookieParams'), '\t')}\n`, '\n')}
	/* NB: setting Cookies does not work in a browser, see https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_header_name */
	localVarHeaderParameter.set("Cookie", localVarCookieParams.toString().replace(/&/g, "; "));
`)}
	${maybe(op.requestBody, rb => `${renderRequestBodyContentTypeBlock(rb)}\n`)}
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
},`
}

function renderFpMethod(generatorContext: CodegenGeneratorContext, ctx: DocumentContext, group: CodegenOperationGroup, op: CodegenOperation, hooks: FetchClientHooks): string {
	const gen = generatorContext.generator()
	const groupName = className(gen, group.name)

	return ts`
${operationDocumentation(generatorContext, op)}
${identifier(gen, op.name)}(${parameterList(generatorContext, op)}options?: RequestInit): (fetch?: FetchAPI, basePath?: string) => Promise<${op.returnNativeType?.serializedType ? op.returnNativeType : 'Response'}> {
	const localVarFetchArgs = ${groupName}ApiFetchParamCreator(configuration).${identifier(gen, op.name)}(${argumentList(generatorContext, op)}options);
	return (fetch: FetchAPI = defaultFetch, basePath: string = BASE_PATH) => {
		return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then((response) => {
			const contentType = response.headers.get('Content-Type');
			const mimeType = contentType ? contentType.replace(/;.*/, '') : undefined;

			${renderResponses(generatorContext, op, hooks)}
		});
	};
},`
}

/**
 * Render the auth-injection block for an API operation. Emits one chunk per
 * scheme per requirement.
 */
function renderSecurityRequirements(generatorContext: CodegenGeneratorContext, op: CodegenOperation): string | Skip {
	const sr = op.securityRequirements
	if (!sr) {
		return SKIP
	}
	return each(sr.requirements, (req) => {
		return each(req.schemes, ({ scheme, scopes }) => renderScheme(generatorContext, scheme, scopes ?? []), '\n')
	}, '\n')
}

function renderScheme(generatorContext: CodegenGeneratorContext, scheme: CodegenSecurityScheme, scopes: CodegenAuthScope[]): string {
	return ts`
// authentication ${scheme.name} required
${when(scheme.isApiKey && scheme.isInHeader, () => ts`
if (configuration && configuration.apiKey) {
	const localVarApiKeyValue = typeof configuration.apiKey === 'function'
		? configuration.apiKey(${stringLiteral(generatorContext, scheme.name)})
		: configuration.apiKey;
	if (localVarApiKeyValue !== null) {
		localVarHeaderParameter.set(${stringLiteral(generatorContext, scheme.paramName ?? '')}, localVarApiKeyValue);
	}
}`)}
${when(scheme.isApiKey && scheme.isInQuery, () => ts`
if (configuration && configuration.apiKey) {
	const localVarApiKeyValue = typeof configuration.apiKey === 'function'
		? configuration.apiKey(${stringLiteral(generatorContext, scheme.name)})
		: configuration.apiKey;
	if (localVarApiKeyValue !== null) {
		localVarQueryParameter.set(${stringLiteral(generatorContext, scheme.paramName ?? '')}, localVarApiKeyValue);
	}
}`)}
${when(scheme.isBasic, () => ts`
// http basic authentication required
if (configuration && (configuration.username || configuration.password)) {
	localVarHeaderParameter.set("Authorization", "Basic " + btoa(configuration.username + ":" + configuration.password));
}`)}
${when(scheme.isOAuth || scheme.isOpenIdConnect, () => ts`
// oauth or openIdConnect required
if (configuration && configuration.authorization) {
	const localVarAuthorizationValue = typeof configuration.authorization === 'function'
		? configuration.authorization(${stringLiteral(generatorContext, scheme.name)}, [${scopes.map(s => stringLiteral(generatorContext, s.name)).join(', ')}])
		: configuration.authorization;
	if (localVarAuthorizationValue !== null) {
		localVarHeaderParameter.set("Authorization", "Bearer " + localVarAuthorizationValue);
	}
}`)}
${when(scheme.isHttp, () => ts`
// http authorization required
if (configuration && configuration.authorization) {
	const localVarAuthorizationValue = typeof configuration.authorization === 'function'
		? configuration.authorization(${stringLiteral(generatorContext, scheme.name)})
		: configuration.authorization;
	if (localVarAuthorizationValue !== null) {
		localVarHeaderParameter.set("Authorization", "${capitalize(scheme.scheme)} " + localVarAuthorizationValue);
	}
}`)}`
}

function renderResponses(generatorContext: CodegenGeneratorContext, op: CodegenOperation, hooks: FetchClientHooks): string {
	const respond = hooks.apiResponseContent ?? defaultApiResponseContent

	/* Renders the mime-type dispatch for a response's contents, or the no-content fallback. */
	const contentBranches = (response: CodegenResponse): string => response.contents
		? ts`
${each(response.contents, (content) => ts`
if (mimeType === ${stringLiteral(generatorContext, content.mediaType.mimeType)}) {
	${response.isDefault ? respond(content) : 'throw response;'}
}`, '\n')}
throw response;`
		: 'return response;'

	return ts`
${each(op.responses, (response) => when(!response.isCatchAll, () => ts`
if (response.status === ${String(response.code)}) {
	${contentBranches(response)}
}`), '\n')}
${op.catchAllResponse ? ts`
/* Catch-all response */
${contentBranches(op.catchAllResponse)}` : 'throw response;'}`
}

function renderRequestBodyContentTypeBlock(rb: CodegenRequestBody): string {
	const consumes = rb.consumes
	if (consumes && consumes.length > 0) {
		return `localVarHeaderParameter.set('Content-Type', '${consumes[0].mediaType}');`
	}
	return 'localVarHeaderParameter.set(\'Content-Type\', \'application/json\');'
}

function renderRequestBodyEncodingBlock(generatorContext: CodegenGeneratorContext, ctx: DocumentContext, op: CodegenOperation): string | Skip {
	const rb = op.requestBody
	if (!rb || !rb.nativeType) {
		return SKIP
	}
	const gen = generatorContext.generator()
	const id = identifier(gen, rb.name)
	const dc = rb.defaultContent

	let inner: string
	if (!dc) {
		inner = `localVarRequestOptions.body = ${id};`
	} else if (isContentFormUrlEncoded(dc)) {
		inner = ts`
const localVarFormParams = new URLSearchParams();
${each(allProperties(rb.schema as CodegenObjectSchema), (p) => requestParameter({
			parameter: { ...p, encoding: dc.encoding ? idx.get(dc.encoding.properties, p.name) ?? null : null },
			dest: 'localVarFormParams',
			var: `${id}["${p.serializedName}"]`,
			dateApproach: ctx.dateApproach,
			generatorContext,
		}), '\n')}
localVarRequestOptions.body = localVarFormParams;`
	} else if (isContentJson(dc)) {
		inner = `localVarRequestOptions.body = JSON.stringify(${id} || {});`
	} else if (isContentMultipart(dc)) {
		inner = ts`
const localVarFormData = new FormData();
${each(dc.encoding?.properties, (encProp) => {
			const propName = encProp.property.serializedName
			if (isArray(encProp.property)) {
				return ts`
if (${id}[${stringLiteral(generatorContext, propName)}] !== undefined) {
	for (const __anObject of ${id}.${identifier(gen, encProp.property.name)}${encProp.property.nullable ? ' || []' : ''}) {
		${multipartProperty({ encoding: encProp, propertyVar: '__anObject', bodyPartsVar: 'localVarFormData', generatorContext })}
	}
}`
			}
			return ts`
if (${id}[${stringLiteral(generatorContext, propName)}] !== undefined) {
	${multipartProperty({ encoding: encProp, propertyVar: `${id}[${stringLiteral(generatorContext, propName)}]`, bodyPartsVar: 'localVarFormData', generatorContext })}
}`
		}, '\n')}
localVarRequestOptions.body = localVarFormData;`
	} else {
		inner = `localVarRequestOptions.body = ${id};`
	}

	/* The first line of the template is the margin; the second, blank, line
	 * separates the rendered block from the statements that precede it. */
	return ts`

	if (${id} !== undefined) {
		${inner}
	}`
}
