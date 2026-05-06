import { CodegenEnumSchema, CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { ts, each, className, SKIP } from '@openapi-generator-plus/template-utils'
import { schemaDocumentation } from './frag/schemaDocumentation'

export function modelEnum(generatorContext: CodegenGeneratorContext, schema: CodegenEnumSchema): string {
	const name = className(generatorContext.generator(), schema.name)
	return ts`${schemaDocumentation(schema) || SKIP}
export type ${name} = ValuesOf<typeof ${name}>;

export const ${name} = {
${each(schema.enumValues, (v) => `	${v.name}: ${v.literalValue},`, '\n')}
} as const;`
}
