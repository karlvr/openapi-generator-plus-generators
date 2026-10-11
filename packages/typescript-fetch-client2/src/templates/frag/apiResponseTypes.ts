import { CodegenOperation, CodegenGeneratorContext, CodegenResponse, CodegenContent } from '@openapi-generator-plus/types'
import { ts, each, className, stringLiteral, isContentJson, isBinary, isString } from '@openapi-generator-plus/template-utils'
import * as idx from '@openapi-generator-plus/indexed-type'
import { AnnotatedOperation } from '../types'

/**
 * Report whether an operation that has a catch-all response can still produce an undocumented
 * response. A catch-all response covers every status code, but it covers only the content types
 * that it documents. A response with any other content type stays undocumented.
 */
export function catchAllNeedsUndocumentedResponse(op: CodegenOperation): boolean {
	return !!op.catchAllResponse?.contents
}

export function apiResponseTypes(generatorContext: CodegenGeneratorContext, op: AnnotatedOperation): string {
	const responseTypeName = `${className(generatorContext.generator(), op.name)}Response`
	const unionMembers = collectUnionMembers(generatorContext, op)
	const trailingMembers: string[] = []
	if (!op.catchAllResponse) {
		if (op.addUnauthorizedResponseHandling) {
			trailingMembers.push('UnauthorizedResponse')
		}
		trailingMembers.push('UndocumentedResponse')
	} else if (catchAllNeedsUndocumentedResponse(op)) {
		trailingMembers.push('UndocumentedResponse')
	}
	trailingMembers.push('FetchErrorResponse')

	return ts`
export type ${responseTypeName} =
${each([...unionMembers, ...trailingMembers], (m) => `	| ${m}`, '\n')}

${collectInterfaces(generatorContext, op)}`
}

function collectUnionMembers(generatorContext: CodegenGeneratorContext, op: CodegenOperation): string[] {
	const members: string[] = []
	if (!op.responses) {
		return members
	}
	for (const response of idx.allValues(op.responses)) {
		if (response.contents && response.contents.length > 0) {
			for (const content of response.contents) {
				members.push(responseInterfaceName(generatorContext, op, response, content))
			}
		} else {
			members.push(responseInterfaceName(generatorContext, op, response, null))
		}
	}
	return members
}

/**
 * The name of the interface for one response of an operation, and for one of its contents when the
 * response has more than one. The union type and the interface declaration must use the same name.
 */
function responseInterfaceName(generatorContext: CodegenGeneratorContext, op: CodegenOperation, response: CodegenResponse, content: CodegenContent | null): string {
	const baseName = `${op.name}_${response.code}`
	const suffix = content && response.contents && response.contents.length > 1 ? className(generatorContext.generator(), content.mediaType.mimeType) : ''
	return `${className(generatorContext.generator(), baseName)}${suffix}Response`
}

/**
 * The `status` member of a response interface. A catch-all response matches any status code.
 */
function responseStatusLine(response: CodegenResponse): string {
	return response.isCatchAll ? 'status: number' : `status: ${response.code}`
}

function collectInterfaces(generatorContext: CodegenGeneratorContext, op: CodegenOperation): string {
	if (!op.responses) {
		return ''
	}
	const parts: string[] = []
	for (const response of idx.allValues(op.responses)) {
		if (response.contents && response.contents.length > 0) {
			for (const content of response.contents) {
				parts.push(renderContentInterface(generatorContext, op, response, content))
			}
		} else {
			parts.push(renderNoContentInterface(generatorContext, op, response))
		}
	}
	return parts.join('\n\n')
}

function renderContentInterface(generatorContext: CodegenGeneratorContext, op: CodegenOperation, response: CodegenResponse, content: CodegenContent): string {
	const interfaceName = responseInterfaceName(generatorContext, op, response, content)
	const headersBlock = response.headers ? ts`
	headers: {
${each(response.headers, (h) => `		${stringLiteral(generatorContext, h.name)}?: ${h.schema.nativeType}`, '\n')}
	}` : '	headers?: undefined'

	let bodyBlock: string
	if (content.nativeType) {
		if (!content.schema) {
			bodyBlock = '	/* No schema */\n	body?: undefined'
		} else if (isContentJson(content)) {
			bodyBlock = `	body: ${content.nativeType}`
		} else if (isBinary(content.schema)) {
			bodyBlock = `	body: ${content.nativeType}`
		} else if (isString(content.schema)) {
			bodyBlock = `	body: ${content.nativeType}`
		} else {
			bodyBlock = '	/* Unsupported mimeType for parsing */\n	response: Response'
		}
	} else {
		bodyBlock = '	body?: undefined'
	}

	return ts`
export interface ${interfaceName} {
	${responseStatusLine(response)}
	contentType: ${stringLiteral(generatorContext, content.mediaType.mimeType)}
${bodyBlock}
${headersBlock}
}`
}

function renderNoContentInterface(generatorContext: CodegenGeneratorContext, op: CodegenOperation, response: CodegenResponse): string {
	const interfaceName = responseInterfaceName(generatorContext, op, response, null)
	const headersBlock = response.headers ? ts`
	headers: {
${each(response.headers, (h) => `		${stringLiteral(generatorContext, h.name)}?: ${h.schema.nativeType}`, '\n')}
	}` : '	headers?: undefined'
	return ts`
export interface ${interfaceName} {
	${responseStatusLine(response)}
	body?: undefined
${headersBlock}
}`
}
