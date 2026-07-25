import { CodegenOneOfSchema, CodegenAnyOfSchema, CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { ts, each, className } from '@openapi-generator-plus/template-utils'
import { modelNestedModels } from './modelNestedModels'

export function modelOneOf(generatorContext: CodegenGeneratorContext, schema: CodegenOneOfSchema | CodegenAnyOfSchema): string {
	const name = className(generatorContext.generator(), schema.name)
	return ts`
export type ${name} = ${each(schema.composes, (s) => `${s.nativeType.parentType}`, ' | ')};
${modelNestedModels(generatorContext, schema)}`
}
