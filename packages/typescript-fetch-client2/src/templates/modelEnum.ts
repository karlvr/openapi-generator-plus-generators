import { CodegenEnumSchema, CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { ts, each, className, maybe, md, indent } from '@openapi-generator-plus/template-utils'
import { schemaDocumentation } from './frag/schemaDocumentation'

/**
 * Render the type of an enum, the union of its values.
 * @param path the path of the object of enum values that holds the values of this enum
 */
export function modelEnum(generatorContext: CodegenGeneratorContext, schema: CodegenEnumSchema, path: string[]): string {
	const name = className(generatorContext.generator(), schema.name)
	return ts`
${maybe(schemaDocumentation(schema))}
export type ${name} = ValuesOf<typeof ${[...path, name].join('.')}>;`
}

/** Render the values of an enum, as a property of the object of enum values for its scope. */
export function modelEnumValues(generatorContext: CodegenGeneratorContext, schema: CodegenEnumSchema): string {
	const name = className(generatorContext.generator(), schema.name)
	return ts`
${maybe(schemaDocumentation(schema))}
${name}: {
${each(schema.enumValues, (v) => ts`
${maybe(v.description, d => `	/**
${indent(md(d), '	 * ')}
	 */`)}
	${v.name}: ${v.literalValue},`, '\n')}
},`
}
