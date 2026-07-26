import { CodegenInterfaceSchema, CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { ts, each, className, maybe, when } from '@openapi-generator-plus/template-utils'
import { schemaDocumentation } from './frag/schemaDocumentation'
import { discriminator } from './frag/discriminator'
import { propertyDocumentation } from './frag/propertyDocumentation'
import { modelNestedModels } from './modelNestedModels'

export function modelInterface(generatorContext: CodegenGeneratorContext, schema: CodegenInterfaceSchema): string {
	const name = className(generatorContext.generator(), schema.name)
	const parents = schema.parents ?? []

	return ts`
${maybe(schemaDocumentation(schema))}
export interface ${name}${when(parents.length > 0, () => ` extends ${each(parents, (p) => p.nativeType.parentType, ', ')}`)} {
${maybe(discriminator(schema))}
${maybe(schema.additionalProperties, ap => `	[key: string]: ${ap.component.nativeType} | undefined\n`)}
${each(schema.properties, (p) => ts`
	${maybe(propertyDocumentation({ property: p, memberOf: schema.name, generatorContext }))}
	${p.serializedName}${p.required ? '' : '?'}: ${p.nativeType.serializedType};`, '\n')}
}
${modelNestedModels(generatorContext, schema)}`
}
