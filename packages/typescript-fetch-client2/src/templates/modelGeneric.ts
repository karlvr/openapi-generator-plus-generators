import { CodegenObjectSchema, CodegenGeneratorContext, CodegenMapSchema } from '@openapi-generator-plus/types'
import { ts, each, className, quoteInvalidIdentifier, maybe } from '@openapi-generator-plus/template-utils'
import { schemaDocumentation } from './frag/schemaDocumentation'
import { discriminator } from './frag/discriminator'
import { extendsClause } from './frag/extends'
import { propertyDocumentation } from './frag/propertyDocumentation'
import { modelNestedModels } from './modelNestedModels'

export function modelGeneric(generatorContext: CodegenGeneratorContext, schema: CodegenObjectSchema): string {
	const name = className(generatorContext.generator(), schema.name)
	const parents = schema.parents ?? []
	const implementsList = (schema as CodegenObjectSchema & { implements?: Array<{ nativeType: string }> }).implements ?? []

	let extendsList = ''
	if (parents.length > 0) {
		extendsList = ' extends ' + each(parents, (p, _i, _f, isLast) => {
			const ext = extendsClause(p, p.nativeType.parentType)
			return isLast ? ext : `${ext}, `
		})
	}
	if (implementsList.length > 0) {
		extendsList += parents.length > 0 ? ', ' : ' extends '
		extendsList += each(implementsList, (i, _idx, _f, isLast) => {
			const ext = extendsClause(schema, i.nativeType)
			return isLast ? ext : `${ext}, `
		})
	}

	const additionalProps = (schema as CodegenObjectSchema & { additionalProperties?: { component: { nativeType: string } } | null }).additionalProperties
	const additional = maybe(additionalProps, ap => `	[key: string]: ${ap.component.nativeType} | undefined;\n`)
	const component = (schema as CodegenObjectSchema & { component?: { nativeType: string } | null }).component
	const componentLine = maybe(component, c => `	[key: string]: ${c.nativeType};\n`)

	const propsBody = each(schema.properties, (p) => {
		const doc = propertyDocumentation({ property: p, memberOf: schema.name, generatorContext })
		const ro = p.readOnly ? 'readonly ' : ''
		const optional = p.required ? '' : '?'
		return ts`	${maybe(doc)}
	${ro}${quoteInvalidIdentifier(generatorContext, p.serializedName)}${optional}: ${p.nativeType.serializedType};`
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

export type _MapSchemaTypeReference = CodegenMapSchema
