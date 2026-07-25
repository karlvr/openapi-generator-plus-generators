import { CodegenArraySchema, CodegenGeneratorContext, CodegenSchemaUsage } from '@openapi-generator-plus/types'
import { stringLiteral } from '@openapi-generator-plus/template-utils'
import { DateApproach } from '@openapi-generator-plus/typescript-generator-common'
import { schemaToString } from './schemaToString'

export interface ArrayToStringArgs {
	value: string
	separator: string
	parameter: CodegenSchemaUsage
	dateApproach: DateApproach
	generatorContext: CodegenGeneratorContext
}

export function arrayToString(args: ArrayToStringArgs): string {
	const { value, separator, parameter, dateApproach, generatorContext } = args
	const component = (parameter.schema as CodegenArraySchema).component
	const inner = schemaToString({ value: 'localVarArrayMapElement', schema: component, dateApproach })
	return `${value}.map(localVarArrayMapElement => escape(${inner})).join(${stringLiteral(generatorContext, separator)})`
}
