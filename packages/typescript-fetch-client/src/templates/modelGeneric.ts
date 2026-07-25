import { CodegenObjectSchema, CodegenGeneratorContext, CodegenMapSchema } from '@openapi-generator-plus/types'
import { ts, each, className, quoteInvalidIdentifier, maybe, when, join } from '@openapi-generator-plus/template-utils'
import { schemaDocumentation } from './frag/schemaDocumentation'
import { discriminator } from './frag/discriminator'
import { extendsClause } from './frag/extends'
import { propertyDocumentation } from './frag/propertyDocumentation'
import { modelNestedModels } from './modelNestedModels'

export function modelGeneric(generatorContext: CodegenGeneratorContext, schema: CodegenObjectSchema): string {
	const name = className(generatorContext.generator(), schema.name)
	const parents = schema.parents ?? []
	const implementsList = schema.implements ?? []

	return ts`
${maybe(schemaDocumentation(schema))}
export interface ${name}${when(parents.length > 0 || implementsList.length > 0, () => ` extends ${join([
		each(parents, (p) => extendsClause(p, p.nativeType.parentType), ', '),
		each(implementsList, (i) => extendsClause(schema, i.nativeType.nativeType), ', '),
	], ', ')}`)} {
${maybe(discriminator(schema))}
${maybe(schema.additionalProperties, ap => `	[key: string]: ${ap.component.nativeType} | undefined;\n`)}
${each(schema.properties, (p) => ts`
	${maybe(propertyDocumentation({ property: p, memberOf: schema.name, generatorContext }))}
	${p.readOnly ? 'readonly ' : ''}${quoteInvalidIdentifier(generatorContext, p.serializedName)}${p.required ? '' : '?'}: ${p.nativeType.serializedType};`, '\n')}
}
${modelNestedModels(generatorContext, schema)}`
}

export type _MapSchemaTypeReference = CodegenMapSchema
