import { CodegenOperation, CodegenGeneratorContext, CodegenResponse, CodegenContent } from '@openapi-generator-plus/types'
import { ts, each, className, stringLiteral, isContentJson, isBinary, isString } from '@openapi-generator-plus/template-utils'
import * as idx from '@openapi-generator-plus/indexed-type'
import { AnnotatedOperation } from '../types'

export function apiResponseTypes(generatorContext: CodegenGeneratorContext, op: AnnotatedOperation): string {
	const responseTypeName = `${className(generatorContext.generator(), op.name)}Response`
	const unionMembers = collectUnionMembers(generatorContext, op)
	const trailingMembers: string[] = []
	if (!op.catchAllResponse) {
		if (op.addUnauthorizedResponseHandling) {
			trailingMembers.push('UnauthorizedResponse')
		}
		trailingMembers.push('UndocumentedResponse')
	}
	trailingMembers.push('FetchErrorResponse')

	const allMembers = [...unionMembers, ...trailingMembers]
	const union = each(allMembers, (m) => `\t| ${m}`, '\n')

	const interfaces = collectInterfaces(generatorContext, op)
	return ts`export type ${responseTypeName} =
${union}

${interfaces}`
}

function collectUnionMembers(generatorContext: CodegenGeneratorContext, op: CodegenOperation): string[] {
	const members: string[] = []
	if (!op.responses) {
		return members
	}
	for (const response of idx.allValues(op.responses)) {
		if (response.contents && response.contents.length > 0) {
			for (const content of response.contents) {
				const baseName = `${op.name}_${response.code}`
				const suffix = response.contents.length > 1 ? className(generatorContext.generator(), content.mediaType.mimeType) : ''
				members.push(`${className(generatorContext.generator(), baseName)}${suffix}Response`)
			}
		} else {
			const baseName = `${op.name}_${response.code}`
			members.push(`${className(generatorContext.generator(), baseName)}Response`)
		}
	}
	return members
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
	const baseName = `${op.name}_${response.code}`
	const suffix = response.contents && response.contents.length > 1 ? className(generatorContext.generator(), content.mediaType.mimeType) : ''
	const interfaceName = `${className(generatorContext.generator(), baseName)}${suffix}Response`
	const statusLine = response.isCatchAll ? 'status: number' : `status: ${response.code}`
	const headersBlock = response.headers ? ts`	headers: {
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

	return ts`export interface ${interfaceName} {
	${statusLine}
	contentType: ${stringLiteral(generatorContext, content.mediaType.mimeType)}
${bodyBlock}
${headersBlock}
}`
}

function renderNoContentInterface(generatorContext: CodegenGeneratorContext, op: CodegenOperation, response: CodegenResponse): string {
	const interfaceName = `${className(generatorContext.generator(), op.name)}${response.code}Response`
	const headersBlock = response.headers ? ts`	headers: {
${each(response.headers, (h) => `		${stringLiteral(generatorContext, h.name)}?: ${h.schema.nativeType}`, '\n')}
	}` : '	headers?: undefined'
	return ts`export interface ${interfaceName} {
	status: ${response.code}
	body?: undefined
${headersBlock}
}`
}
