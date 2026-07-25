import { CodegenObjectSchema } from '@openapi-generator-plus/types'
import { ts, each } from '@openapi-generator-plus/template-utils'

/**
 * The discriminator-bearing fields of an object-like schema. Object and
 * interface schemas both satisfy this.
 */
export type DiscriminatorSchema = Pick<CodegenObjectSchema, 'discriminator' | 'discriminatorValues'>

export function discriminator(schema: DiscriminatorSchema): string {
	const parts: string[] = []
	if (schema.discriminator) {
		parts.push(ts`
	/**
	 * Discriminator property
	 */
	${schema.discriminator.serializedName}: ${schema.discriminator.nativeType.serializedType};
`)
	}
	if (schema.discriminatorValues) {
		for (const dv of schema.discriminatorValues) {
			const schemaList = each(dv.schemas, (s, _i, _f, isLast) => isLast ? s.nativeType.parentType : `${s.nativeType.parentType}, `)
			parts.push(ts`
	/**
	 * Value for discriminator in ${schemaList}
	 */
	${dv.discriminator?.serializedName ?? ''}: ${dv.literalValue};
`)
		}
	}
	return parts.join('\n')
}
