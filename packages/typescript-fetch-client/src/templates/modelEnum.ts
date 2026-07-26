import { CodegenEnumSchema, CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { ts, each, className, maybe, md, indent } from '@openapi-generator-plus/template-utils'
import { schemaDocumentation } from './frag/schemaDocumentation'

export function modelEnum(generatorContext: CodegenGeneratorContext, schema: CodegenEnumSchema): string {
	const name = className(generatorContext.generator(), schema.name)
	return ts`
${maybe(schemaDocumentation(schema))}
export enum ${name} {
${each(schema.enumValues, (v, _i, _f, isLast) => ts`
${maybe(v.description, d => `	/**
${indent(md(d), '\t * ')}
	 */`)}
	${v.name} = ${v.literalValue}${isLast ? '' : ','}`, '\n')}
}`
}
