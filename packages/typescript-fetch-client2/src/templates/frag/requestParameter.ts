import { CodegenArraySchema, CodegenEncodingStyle, CodegenGeneratorContext, CodegenLogLevel, CodegenObjectSchema, CodegenParameterEncoding, CodegenSchemaUsage } from '@openapi-generator-plus/types'
import { ts, isArray, isObject, allProperties, each } from '@openapi-generator-plus/template-utils'
import { DateApproach } from '@openapi-generator-plus/typescript-generator-common'
import { arrayToString } from './arrayToString'
import { objectToString } from './objectToString'
import { schemaToString } from './schemaToString'

/**
 * The parameter-ish values we can serialize into a request: an operation
 * parameter, or a request-body property paired with its content encoding.
 */
export type EncodableParameter = CodegenSchemaUsage & {
	serializedName: string
	encoding?: CodegenParameterEncoding | null
}

export interface RequestParameterArgs {
	parameter: EncodableParameter
	dest: string
	var: string
	dateApproach: DateApproach
	generatorContext: CodegenGeneratorContext
}

/**
 * Render the code that takes a parameter and pushes it onto a URLSearchParams
 * (or Headers etc) under `dest`. Uses the parameter's encoding style to decide
 * how to flatten arrays/objects.
 */
export function requestParameter(args: RequestParameterArgs): string {
	const { parameter, dest, var: varName, dateApproach } = args
	const style = parameter.encoding?.style ?? CodegenEncodingStyle.FORM
	const explode = !!parameter.encoding?.explode

	if (isArray(parameter)) {
		return ts`
if (${varName} !== undefined) {
${arrayBranch(args, style, explode)}
}`
	}
	if (isObject(parameter)) {
		return ts`
if (${varName} !== undefined) {
${objectBranch(args, style, explode)}
}`
	}
	const inner = schemaToString({ value: varName, schema: parameter, dateApproach })
	return ts`
if (${varName} !== undefined) {
	${dest}.append('${parameter.serializedName}', ${inner});
}`
}

function arrayBranch(args: RequestParameterArgs, style: CodegenEncodingStyle, explode: boolean): string {
	const { parameter, dest, var: varName, dateApproach, generatorContext } = args
	const componentSchema = (parameter.schema as CodegenArraySchema).component
	switch (style) {
		case CodegenEncodingStyle.FORM:
			if (explode) {
				return ts`
	/* array form exploded */
	for (const localVarArrayElement of ${varName}) {
		if (localVarArrayElement !== undefined) {
			${dest}.append('${parameter.serializedName}', localVarArrayElement !== null ? ${schemaToString({ value: 'localVarArrayElement', schema: componentSchema, dateApproach })} : '');
		}
	}`
			}
			return ts`
	/* array form */
	${dest}.append('${parameter.serializedName}', ${arrayToString({ value: varName, separator: ',', parameter, dateApproach, generatorContext })});`
		case CodegenEncodingStyle.SPACE_DELIMITED:
			return ts`
	/* array space delimited */
	${dest}.append('${parameter.serializedName}', ${arrayToString({ value: varName, separator: ' ', parameter, dateApproach, generatorContext })});`
		case CodegenEncodingStyle.PIPE_DELIMITED:
			return ts`
	/* array pipe delimited */
	${dest}.append('${parameter.serializedName}', ${arrayToString({ value: varName, separator: '|', parameter, dateApproach, generatorContext })});`
		case CodegenEncodingStyle.SIMPLE:
			return ts`
	/* array simple */
	${dest}.append('${parameter.serializedName}', ${arrayToString({ value: varName, separator: ',', parameter, dateApproach, generatorContext })});`
		default:
			generatorContext.log(CodegenLogLevel.WARN, `Array encoding style ${style} not supported`)
			return '	throw new Error("Unsupported parameter encoding");'
	}
}

function objectBranch(args: RequestParameterArgs, style: CodegenEncodingStyle, explode: boolean): string {
	const { parameter, dest, var: varName, dateApproach, generatorContext } = args
	const props = allProperties(parameter.schema as CodegenObjectSchema)
	switch (style) {
		case CodegenEncodingStyle.FORM:
			if (explode) {
				const lines = each(props, (p) => {
					const access = `${varName}["${p.serializedName}"]`
					const stringified = schemaToString({ value: access, schema: p, dateApproach })
					return ts`
	if (${access} !== undefined) {
		${dest}.append('${p.serializedName}', ${access} !== null ? ${stringified} : '');
	}`
				}, '\n')
				return `	/* object form exploded */\n${lines}`
			}
			return ts`
	/* object form */
	${dest}.append('${parameter.serializedName}', ${objectToString({ value: varName, separator: ',', keyValueSeparator: ',', indent: '\t\t', parameter, dateApproach, generatorContext })});`
		case CodegenEncodingStyle.SPACE_DELIMITED:
			return ts`
	/* object space delimited */
	${dest}.append('${parameter.serializedName}', ${objectToString({ value: varName, separator: ' ', keyValueSeparator: ' ', indent: '\t\t', parameter, dateApproach, generatorContext })});`
		case CodegenEncodingStyle.PIPE_DELIMITED:
			return ts`
	/* object pipe delimited */
	${dest}.append('${parameter.serializedName}', ${objectToString({ value: varName, separator: '|', keyValueSeparator: '|', indent: '\t\t', parameter, dateApproach, generatorContext })});`
		case CodegenEncodingStyle.DEEP_OBJECT: {
			const lines = each(props, (p) => {
				const access = `${varName}["${p.serializedName}"]`
				const stringified = schemaToString({ value: access, schema: p, dateApproach })
				return ts`
	if (${access} !== undefined) {
		${dest}.append('${parameter.serializedName}[${p.serializedName}]', ${access} !== null ? ${stringified} : '');
	}`
			}, '\n')
			return `	/* object deepObject */\n${lines}`
		}
		case CodegenEncodingStyle.SIMPLE:
			if (explode) {
				return ts`
	/* object simple exploded */
	${dest}.append('${parameter.serializedName}', ${objectToString({ value: varName, separator: ',', keyValueSeparator: '=', indent: '\t\t', parameter, dateApproach, generatorContext })});`
			}
			return ts`
	/* object simple */
	${dest}.append('${parameter.serializedName}', ${objectToString({ value: varName, separator: ',', keyValueSeparator: ',', indent: '\t\t', parameter, dateApproach, generatorContext })});`
		default:
			generatorContext.log(CodegenLogLevel.WARN, `Object encoding style ${style} not supported`)
			return '	throw new Error("Unsupported parameter encoding");'
	}
}
