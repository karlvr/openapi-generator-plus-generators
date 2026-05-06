import { CodegenInterfaceSchema, CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { ts, each, className, SKIP } from '@openapi-generator-plus/template-utils'
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
	const additional = additionalProps ? `	[key: string]: ${additionalProps.component.nativeType} | undefined\n` : SKIP
	const component = (schema as CodegenInterfaceSchema & { component?: { nativeType: string } | null }).component
	const componentLine = component ? `	[key: string]: ${component.nativeType}\n` : SKIP

	const propsBody = each(schema.properties, (p) => {
		const doc = propertyDocumentation({ property: p, memberOf: schema.name, generatorContext })
		const optional = p.required ? '' : '?'
		return ts`	${doc || SKIP}
	${p.serializedName}${optional}: ${p.nativeType.serializedType};`
	}, '\n')

	return ts`${schemaDocumentation(schema) || SKIP}
export interface ${name}${extendsList} {
${discriminator(schema as unknown as Parameters<typeof discriminator>[0]) || SKIP}
${additional}
${componentLine}
${propsBody}
}
${modelNestedModels(generatorContext, schema)}`
}
