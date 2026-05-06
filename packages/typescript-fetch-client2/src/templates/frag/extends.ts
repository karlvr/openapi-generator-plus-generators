import { CodegenSchema } from '@openapi-generator-plus/types'
import { each } from '@openapi-generator-plus/template-utils'

/**
 * Render an extends-clause type for the schema, taking discriminator-shadowed
 * properties into account. `extendsType` is the native type to extend.
 */
export function extendsClause(schema: CodegenSchema, extendsType: string): string {
	const discriminatorValues = (schema as { discriminatorValues?: Array<{ discriminator: { serializedName: string } }> }).discriminatorValues
	if (discriminatorValues && discriminatorValues.length > 0) {
		const omitKeys = each(discriminatorValues, (dv, _i, _f, isLast) => {
			return isLast ? `'${dv.discriminator.serializedName}'` : `'${dv.discriminator.serializedName}' | `
		})
		return `Omit<${extendsType}, ${omitKeys}>`
	}
	return extendsType
}
