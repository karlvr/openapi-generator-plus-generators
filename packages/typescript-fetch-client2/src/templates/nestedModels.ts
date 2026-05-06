import { CodegenSchemas, CodegenGeneratorContext, isCodegenEnumSchema, isCodegenObjectSchema, isCodegenOneOfSchema, isCodegenAnyOfSchema, isCodegenInterfaceSchema } from '@openapi-generator-plus/types'
import { each, indent, SKIP, Skip } from '@openapi-generator-plus/template-utils'
import * as idx from '@openapi-generator-plus/indexed-type'
import { modelEnum } from './modelEnum'
import { modelGeneric } from './modelGeneric'
import { modelInterface } from './modelInterface'
import { modelOneOf } from './modelOneOf'

export function nestedModels(generatorContext: CodegenGeneratorContext, scope: { schemas: CodegenSchemas | null }): string | Skip {
	if (!scope.schemas) {
		return SKIP
	}
	const schemas = idx.allValues(scope.schemas)
	return each(schemas, (schema) => {
		let body: string
		if (isCodegenEnumSchema(schema)) {
			body = modelEnum(generatorContext, schema)
		} else if (isCodegenObjectSchema(schema)) {
			body = modelGeneric(generatorContext, schema)
		} else if (isCodegenOneOfSchema(schema) || isCodegenAnyOfSchema(schema)) {
			body = modelOneOf(generatorContext, schema)
		} else if (isCodegenInterfaceSchema(schema)) {
			body = modelInterface(generatorContext, schema)
		} else {
			return SKIP
		}
		/* Indent every nested model so it sits inside its enclosing namespace. */
		return indent(body, '\t')
	}, '\n\n')
}
