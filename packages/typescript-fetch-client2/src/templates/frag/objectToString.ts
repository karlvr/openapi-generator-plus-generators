import { CodegenSchemaUsage, CodegenObjectSchema, CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { allProperties, each } from '@openapi-generator-plus/template-utils'
import { schemaToString } from './schemaToString'

export interface ObjectToStringArgs {
	value: string
	separator: string
	keyValueSeparator: string
	indent: string
	parameter: CodegenSchemaUsage
	dateApproach: string
	generatorContext: CodegenGeneratorContext
}

export function objectToString(args: ObjectToStringArgs): string {
	const { value, separator, keyValueSeparator, indent: ind, parameter, dateApproach } = args
	const props = allProperties(parameter.schema as CodegenObjectSchema)
	const entries = each(props, (p, _i, _f, isLast) => {
		const elementValue = `${value}["${p.serializedName}"]`
		const stringified = schemaToString({ value: elementValue, schema: p, dateApproach, indent: ind })
		return `${ind}${elementValue} !== undefined ? ${elementValue} !== null ? \`${p.serializedName}${keyValueSeparator}\${escape(${stringified})}\` : '${p.serializedName}${keyValueSeparator}' : undefined${isLast ? '' : ','}`
	}, '\n')
	/* The result ends with a newline and the indent so that the caller's closing
	 * text continues at the same indent level, mirroring the layout of the
	 * original Handlebars templates. */
	return `[\n${entries}\n${ind}].filter(localVarObjectElement => localVarObjectElement !== undefined).join('${separator}')\n${ind}`
}
