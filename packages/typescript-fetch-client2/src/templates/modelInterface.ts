import { CodegenInterfaceSchema, CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { ts, each, className, maybe } from '@openapi-generator-plus/template-utils'
import { schemaDocumentation } from './frag/schemaDocumentation'
import { discriminator } from './frag/discriminator'
import { propertyDocumentation } from './frag/propertyDocumentation'
import { modelNestedModels } from './modelNestedModels'

export function modelInterface(generatorContext: CodegenGeneratorContext, schema: CodegenInterfaceSchema): string {
	const name = className(generatorContext.generator(), schema.name)
	const parents = schema.parents ?? []
	const extendsList = parents.length > 0
		? ' extends ' + each(parents, (p, _i, _f, isLast) => isLast ? p.nativeType.parentType : `${p.nativeType.parentType}, `)
		: ''

	const additionalProps = (schema as CodegenInterfaceSchema & { additionalProperties?: { component: { nativeType: string } } | null }).additionalProperties
	const additional = maybe(additionalProps, ap => `	[key: string]: ${ap.component.nativeType} | undefined\n`)
	const component = (schema as CodegenInterfaceSchema & { component?: { nativeType: string } | null }).component
	const componentLine = maybe(component, c => `	[key: string]: ${c.nativeType}\n`)

	const propsBody = each(schema.properties, (p) => {
		const doc = propertyDocumentation({ property: p, memberOf: schema.name, generatorContext })
		const optional = p.required ? '' : '?'
		return ts`	${maybe(doc)}
	${p.serializedName}${optional}: ${p.nativeType.serializedType};`
	}, '\n')

	return ts`${maybe(schemaDocumentation(schema))}
export interface ${name}${extendsList} {
${maybe(discriminator(schema as unknown as Parameters<typeof discriminator>[0]))}
${additional}
${componentLine}
${propsBody}
}
${modelNestedModels(generatorContext, schema)}`
}
