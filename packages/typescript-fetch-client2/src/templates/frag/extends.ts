import { CodegenObjectSchema } from '@openapi-generator-plus/types'
import { each } from '@openapi-generator-plus/template-utils'

/**
 * Render an extends-clause type for the schema, taking discriminator-shadowed
 * properties into account. `extendsType` is the native type to extend.
 */
export function extendsClause(schema: Pick<CodegenObjectSchema, 'discriminatorValues'>, extendsType: string): string {
	const discriminatorValues = schema.discriminatorValues
	if (discriminatorValues && discriminatorValues.length > 0) {
		const omitKeys = each(discriminatorValues, (dv, _i, _f, isLast) => {
			const name = dv.discriminator?.serializedName ?? ''
			return isLast ? `'${name}'` : `'${name}' | `
		})
		return `Omit<${extendsType}, ${omitKeys}>`
	}
	return extendsType
}
