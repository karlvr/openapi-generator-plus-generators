import { CodegenSchemaUsage, CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { stringLiteral } from '@openapi-generator-plus/template-utils'
import { schemaToString } from './schemaToString'

export interface ArrayToStringArgs {
	value: string
	separator: string
	indent: string
	parameter: CodegenSchemaUsage
	dateApproach: string
	generatorContext: CodegenGeneratorContext
}

export function arrayToString(args: ArrayToStringArgs): string {
	const { value, separator, indent: ind, parameter, dateApproach, generatorContext } = args
	const component = (parameter.schema as { component: CodegenSchemaUsage }).component
	const inner = schemaToString({ value: 'localVarArrayMapElement', schema: component, dateApproach, indent: ind })
	return `${value}.map(localVarArrayMapElement => escape(${inner})).join(${stringLiteral(generatorContext, separator)})`
}
