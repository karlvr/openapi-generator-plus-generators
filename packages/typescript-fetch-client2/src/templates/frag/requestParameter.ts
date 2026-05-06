import { CodegenSchemaUsage, CodegenObjectSchema, CodegenGeneratorContext, CodegenLogLevel } from '@openapi-generator-plus/types'
import { ts, isArray, isObject, allProperties, each } from '@openapi-generator-plus/template-utils'
import { arrayToString } from './arrayToString'
import { objectToString } from './objectToString'
import { schemaToString } from './schemaToString'

export interface RequestParameterArgs {
	parameter: CodegenSchemaUsage & { serializedName: string; encoding?: { style?: string; explode?: boolean } | null }
	dest: string
	var: string
	dateApproach: string
	generatorContext: CodegenGeneratorContext
}

/**
 * Render the code that takes a parameter and pushes it onto a URLSearchParams
 * (or Headers etc) under `dest`. Uses the parameter's encoding style to decide
 * how to flatten arrays/objects.
 */
export function requestParameter(args: RequestParameterArgs): string {
	const { parameter, dest, var: varName, dateApproach, generatorContext } = args
	const encoding = parameter.encoding ?? {}
	const style = encoding.style ?? 'form'
	const explode = !!encoding.explode

	if (isArray(parameter)) {
		return ts`if (${varName} !== undefined) {
${arrayBranch(args, style, explode)}
}`
	}
	if (isObject(parameter)) {
		return ts`if (${varName} !== undefined) {
${objectBranch(args, style, explode)}
}`
	}
	const inner = schemaToString({ value: varName, schema: parameter, dateApproach, indent: '\t\t\t\t\t' })
	return ts`if (${varName} !== undefined) {
	${dest}.append('${parameter.serializedName}', ${inner});
}`
	// `generatorContext` is reserved for any future calls that need it.
	void generatorContext
}

function arrayBranch(args: RequestParameterArgs, style: string, explode: boolean): string {
	const { parameter, dest, var: varName, dateApproach, generatorContext } = args
	const componentSchema = (parameter.schema as { component: CodegenSchemaUsage }).component
	switch (style) {
		case 'form':
			if (explode) {
				return ts`	/* array form exploded */
	for (const localVarArrayElement of ${varName}) {
		if (localVarArrayElement !== undefined) {
			${dest}.append('${parameter.serializedName}', localVarArrayElement !== null ? ${schemaToString({ value: 'localVarArrayElement', schema: componentSchema, dateApproach, indent: '\t\t\t' })} : '');
		}
	}`
			}
			return ts`	/* array form */
	${dest}.append('${parameter.serializedName}', ${arrayToString({ value: varName, separator: ',', indent: '\t\t', parameter, dateApproach, generatorContext })});`
		case 'spaceDelimited':
			return ts`	/* array space delimited */
	${dest}.append('${parameter.serializedName}', ${arrayToString({ value: varName, separator: ' ', indent: '\t\t', parameter, dateApproach, generatorContext })});`
		case 'pipeDelimited':
			return ts`	/* array pipe delimited */
	${dest}.append('${parameter.serializedName}', ${arrayToString({ value: varName, separator: '|', indent: '\t\t', parameter, dateApproach, generatorContext })});`
		case 'simple':
			return ts`	/* array simple */
	${dest}.append('${parameter.serializedName}', ${arrayToString({ value: varName, separator: ',', indent: '\t\t', parameter, dateApproach, generatorContext })});`
		default:
			generatorContext.log(CodegenLogLevel.WARN, `Array encoding style ${style} not supported`)
			return `	throw new Error("Unsupported parameter encoding");`
	}
}

function objectBranch(args: RequestParameterArgs, style: string, explode: boolean): string {
	const { parameter, dest, var: varName, dateApproach, generatorContext } = args
	const props = allProperties(parameter.schema as CodegenObjectSchema)
	switch (style) {
		case 'form':
			if (explode) {
				const lines = each(props, (p) => {
					const access = `${varName}["${p.serializedName}"]`
					const stringified = schemaToString({ value: access, schema: p, dateApproach, indent: '\t\t\t' })
					return ts`	if (${access} !== undefined) {
		${dest}.append('${p.serializedName}', ${access} !== null ? ${stringified} : '');
	}`
				}, '\n')
				return `	/* object form exploded */\n${lines}`
			}
			return ts`	/* object form */
	${dest}.append('${parameter.serializedName}', ${objectToString({ value: varName, separator: ',', keyValueSeparator: ',', indent: '\t\t', parameter, dateApproach, generatorContext })});`
		case 'spaceDelimited':
			return ts`	/* object space delimited */
	${dest}.append('${parameter.serializedName}', ${objectToString({ value: varName, separator: ' ', keyValueSeparator: ' ', indent: '\t\t', parameter, dateApproach, generatorContext })});`
		case 'pipeDelimited':
			return ts`	/* object pipe delimited */
	${dest}.append('${parameter.serializedName}', ${objectToString({ value: varName, separator: '|', keyValueSeparator: '|', indent: '\t\t', parameter, dateApproach, generatorContext })});`
		case 'deepObject': {
			const lines = each(props, (p) => {
				const access = `${varName}["${p.serializedName}"]`
				const stringified = schemaToString({ value: access, schema: p, dateApproach, indent: '\t\t\t' })
				return ts`	if (${access} !== undefined) {
		${dest}.append('${parameter.serializedName}[${p.serializedName}]', ${access} !== null ? ${stringified} : '');
	}`
			}, '\n')
			return `	/* object deepObject */\n${lines}`
		}
		case 'simple':
			if (explode) {
				return ts`	/* object simple exploded */
	${dest}.append('${parameter.serializedName}', ${objectToString({ value: varName, separator: ',', keyValueSeparator: '=', indent: '\t\t', parameter, dateApproach, generatorContext })});`
			}
			return ts`	/* object simple */
	${dest}.append('${parameter.serializedName}', ${objectToString({ value: varName, separator: ',', keyValueSeparator: ',', indent: '\t\t', parameter, dateApproach, generatorContext })});`
		default:
			generatorContext.log(CodegenLogLevel.WARN, `Object encoding style ${style} not supported`)
			return `	throw new Error("Unsupported parameter encoding");`
	}
}
