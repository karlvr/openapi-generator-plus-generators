import { ts, each } from '@openapi-generator-plus/template-utils'

interface DiscriminatorValue {
	literalValue: string
	discriminator: { serializedName: string }
	schemas: Array<{ nativeType: { parentType: string } }>
}

interface SchemaWithDiscriminator {
	discriminator?: { serializedName: string; nativeType: { serializedType: string } } | null
	discriminatorValues?: DiscriminatorValue[] | null
}

export function discriminator(schema: SchemaWithDiscriminator): string {
	const parts: string[] = []
	if (schema.discriminator) {
		parts.push(ts`	/**
	 * Discriminator property
	 */
	${schema.discriminator.serializedName}: ${schema.discriminator.nativeType.serializedType};
`)
	}
	if (schema.discriminatorValues) {
		for (const dv of schema.discriminatorValues) {
			const schemaList = each(dv.schemas, (s, _i, _f, isLast) => isLast ? s.nativeType.parentType : `${s.nativeType.parentType}, `)
			parts.push(ts`	/**
	 * Value for discriminator in ${schemaList}
	 */
	${dv.discriminator.serializedName}: ${dv.literalValue};
`)
		}
	}
	return parts.join('\n')
}
