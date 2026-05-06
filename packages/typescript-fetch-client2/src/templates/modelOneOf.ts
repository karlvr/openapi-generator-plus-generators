import { CodegenOneOfSchema, CodegenAnyOfSchema, CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { ts, each, className } from '@openapi-generator-plus/template-utils'
import { modelNestedModels } from './modelNestedModels'

export function modelOneOf(generatorContext: CodegenGeneratorContext, schema: CodegenOneOfSchema | CodegenAnyOfSchema): string {
	const name = className(generatorContext.generator(), schema.name)
	const members = each(schema.composes, (s, _i, _f, isLast) => isLast ? s.nativeType.parentType : `${s.nativeType.parentType} | `)
	return ts`export type ${name} = ${members};
${modelNestedModels(generatorContext, schema)}`
}
