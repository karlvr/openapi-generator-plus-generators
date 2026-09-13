import { CodegenInterfaceSchema, CodegenObjectSchema } from '@openapi-generator-plus/types'
import * as idx from '@openapi-generator-plus/indexed-type'

type ExtendableSchema = Pick<CodegenObjectSchema | CodegenInterfaceSchema, 'properties'> & {
	parents?: (CodegenObjectSchema | CodegenInterfaceSchema)[] | null
}

/**
 * Whether the schema declares the named property, or takes it from a schema that it builds on.
 */
function providesProperty(schema: ExtendableSchema, serializedName: string): boolean {
	if (schema.properties && idx.has(schema.properties, serializedName)) {
		return true
	}
	for (const parent of schema.parents ?? []) {
		if (providesProperty(parent, serializedName)) {
			return true
		}
	}
	return false
}

/**
 * Render an extends-clause type for a schema that extends `parent`.
 *
 * A member of a discriminator narrows the property that holds the discriminator value. TypeScript
 * rejects a narrowing that the extended type does not admit, so the clause omits a property that
 * the member narrows and the extended type provides. `extendsType` is the native type to extend.
 */
export function extendsClause(schema: Pick<CodegenObjectSchema, 'discriminatorValues'>, parent: ExtendableSchema, extendsType: string): string {
	const omitNames: string[] = []
	for (const dv of schema.discriminatorValues ?? []) {
		const name = dv.discriminator?.serializedName
		if (name && providesProperty(parent, name) && omitNames.indexOf(name) === -1) {
			omitNames.push(name)
		}
	}

	if (omitNames.length === 0) {
		return extendsType
	}
	return `Omit<${extendsType}, ${omitNames.map(name => `'${name}'`).join(' | ')}>`
}
