import { CodegenArraySchema, CodegenEncodingStyle, CodegenGeneratorContext, CodegenLogLevel, CodegenObjectSchema, CodegenParameterEncoding, CodegenSchemaUsage } from '@openapi-generator-plus/types'
import { ts, isArray, isObject, allProperties, each, SKIP, Skip } from '@openapi-generator-plus/template-utils'
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
 * Render the condition that admits a value for serialization. An optional value can be
 * `undefined` and a nullable value can be `null`. Neither has a serialized form, so the
 * condition excludes both.
 *
 * Use this only where null has no representation. Where a single serialized string is
 * appended, use {@link nullToEmpty} instead, which keeps null distinct from absent.
 */
export function isPresentCondition(usage: Pick<CodegenSchemaUsage, 'nullable'>, varName: string): string {
	return usage.nullable ? `${varName} !== undefined && ${varName} !== null` : `${varName} !== undefined`
}

/**
 * Render an expression that serializes a value, and that yields an empty string when the value
 * is null. A URL or form encoding carries strings, so it has no null. An empty value represents
 * null, and keeps it distinct from an absent value, which is omitted.
 */
function nullToEmpty(usage: Pick<CodegenSchemaUsage, 'nullable'>, varName: string, serialized: string): string {
	return usage.nullable ? `${varName} !== null ? ${serialized} : ''` : serialized
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
	${dest}.append('${parameter.serializedName}', ${nullToEmpty(parameter, varName, inner)});
}`
}

/**
 * Wrap the code that walks into a nullable container. A null container has no members to walk,
 * so the code runs only when the container is not null. `whenNull` renders the null case, which
 * some encoding styles cannot represent.
 */
function guardNullContainer(usage: Pick<CodegenSchemaUsage, 'nullable'>, varName: string, body: string | Skip, whenNull?: string): string | Skip {
	if (!usage.nullable || body === SKIP) {
		return body
	}
	if (whenNull === undefined) {
		return ts`
if (${varName} !== null) {
	${body}
}`
	}
	return ts`
if (${varName} !== null) {
	${body}
} else {
	${whenNull}
}`
}

function arrayBranch(args: RequestParameterArgs, style: CodegenEncodingStyle, explode: boolean): string {
	const { parameter, dest, var: varName, dateApproach, generatorContext } = args
	const componentSchema = (parameter.schema as CodegenArraySchema).component
	const appendEmpty = `${dest}.append('${parameter.serializedName}', '');`
	const joined = (separator: string) => guardNullContainer(
		parameter, varName,
		`${dest}.append('${parameter.serializedName}', ${arrayToString({ value: varName, separator, parameter, dateApproach, generatorContext })});`,
		appendEmpty,
	)
	switch (style) {
		case CodegenEncodingStyle.FORM:
			if (explode) {
				const loop = ts`
for (const localVarArrayElement of ${varName}) {
	if (localVarArrayElement !== undefined) {
		${dest}.append('${parameter.serializedName}', localVarArrayElement !== null ? ${schemaToString({ value: 'localVarArrayElement', schema: componentSchema, dateApproach })} : '');
	}
}`
				return ts`
	/* array form exploded */
	${guardNullContainer(parameter, varName, loop, appendEmpty)}`
			}
			return ts`
	/* array form */
	${joined(',')}`
		case CodegenEncodingStyle.SPACE_DELIMITED:
			return ts`
	/* array space delimited */
	${joined(' ')}`
		case CodegenEncodingStyle.PIPE_DELIMITED:
			return ts`
	/* array pipe delimited */
	${joined('|')}`
		case CodegenEncodingStyle.SIMPLE:
			return ts`
	/* array simple */
	${joined(',')}`
		default:
			generatorContext.log(CodegenLogLevel.WARN, `Array encoding style ${style} not supported`)
			return '	throw new Error("Unsupported parameter encoding");'
	}
}

function objectBranch(args: RequestParameterArgs, style: CodegenEncodingStyle, explode: boolean): string {
	const { parameter, dest, var: varName, dateApproach, generatorContext } = args
	const props = allProperties(parameter.schema as CodegenObjectSchema)
	const joined = (separator: string, keyValueSeparator: string) => guardNullContainer(
		parameter, varName,
		`${dest}.append('${parameter.serializedName}', ${objectToString({ value: varName, separator, keyValueSeparator, indent: '\t\t', parameter, dateApproach, generatorContext })});`,
		`${dest}.append('${parameter.serializedName}', '');`,
	)
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
				/* An exploded object names each property, so a null object has no name to carry an
				   empty value. It is omitted. */
				return ts`
	/* object form exploded */
	${guardNullContainer(parameter, varName, lines)}`
			}
			return ts`
	/* object form */
	${joined(',', ',')}`
		case CodegenEncodingStyle.SPACE_DELIMITED:
			return ts`
	/* object space delimited */
	${joined(' ', ' ')}`
		case CodegenEncodingStyle.PIPE_DELIMITED:
			return ts`
	/* object pipe delimited */
	${joined('|', '|')}`
		case CodegenEncodingStyle.DEEP_OBJECT: {
			const lines = each(props, (p) => {
				const access = `${varName}["${p.serializedName}"]`
				const stringified = schemaToString({ value: access, schema: p, dateApproach })
				return ts`
if (${access} !== undefined) {
	${dest}.append('${parameter.serializedName}[${p.serializedName}]', ${access} !== null ? ${stringified} : '');
}`
			}, '\n')
			/* A deepObject names each property, so a null object has no name to carry an empty
			   value. It is omitted. */
			return ts`
	/* object deepObject */
	${guardNullContainer(parameter, varName, lines)}`
		}
		case CodegenEncodingStyle.SIMPLE:
			if (explode) {
				return ts`
	/* object simple exploded */
	${joined(',', '=')}`
			}
			return ts`
	/* object simple */
	${joined(',', ',')}`
		default:
			generatorContext.log(CodegenLogLevel.WARN, `Object encoding style ${style} not supported`)
			return '	throw new Error("Unsupported parameter encoding");'
	}
}
