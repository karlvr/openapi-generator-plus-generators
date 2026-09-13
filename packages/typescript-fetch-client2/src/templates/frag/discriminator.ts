import { CodegenDiscriminatorValue, CodegenObjectSchema, CodegenProperty } from '@openapi-generator-plus/types'
import { ts, each } from '@openapi-generator-plus/template-utils'
import * as idx from '@openapi-generator-plus/indexed-type'

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
	for (const narrowed of narrowedDiscriminatorProperties(schema)) {
		const schemaList = each(narrowed.schemas, (s, _i, _f, isLast) => isLast ? s.nativeType.parentType : `${s.nativeType.parentType}, `)
		const heading = narrowed.literalValues.length === 1 ? 'Value for discriminator' : 'Values for discriminators'
		parts.push(ts`
	/**
	 * ${heading} in ${schemaList}
	 */
	${narrowed.serializedName}: ${narrowed.literalValues.join(' | ')};
`)
	}
	return parts.join('\n')
}

/**
 * A property that a member of one or more discriminators narrows to the values that name it.
 */
interface NarrowedDiscriminatorProperty {
	/** The name of the property on the wire. */
	serializedName: string
	/** Each distinct value that names the member, as a literal, in the order of the API. */
	literalValues: string[]
	/** The schemas that hold the discriminators, in the order of the API. */
	schemas: CodegenDiscriminatorValue['schemas']
}

/**
 * The properties that `schema` narrows because it is a member of a discriminator, one for each
 * property.
 *
 * A schema may be a member of more than one discriminator on one property. When those
 * discriminators disagree on the value, the property takes the union of their values. The caller
 * then chooses the value that suits the discriminator it sends the member through.
 */
function narrowedDiscriminatorProperties(schema: DiscriminatorSchema): NarrowedDiscriminatorProperty[] {
	const result: NarrowedDiscriminatorProperty[] = []
	for (const dv of schema.discriminatorValues ?? []) {
		if (!dv.discriminator) {
			continue
		}
		const serializedName = dv.discriminator.serializedName
		let narrowed = result.find(candidate => candidate.serializedName === serializedName)
		if (!narrowed) {
			narrowed = { serializedName, literalValues: [], schemas: [] }
			result.push(narrowed)
		}
		if (narrowed.literalValues.indexOf(dv.literalValue) === -1) {
			narrowed.literalValues.push(dv.literalValue)
		}
		for (const s of dv.schemas) {
			if (narrowed.schemas.indexOf(s) === -1) {
				narrowed.schemas.push(s)
			}
		}
	}
	return result
}

/**
 * The properties that a schema must declare itself.
 *
 * `discriminator` renders a property that holds a discriminator value, and it narrows the type of
 * that property to the value. Use this for the remaining properties, so that the schema declares
 * each property once.
 */
export function declaredProperties(schema: DiscriminatorSchema & Pick<CodegenObjectSchema, 'properties'>): CodegenProperty[] {
	const properties = schema.properties ? idx.allValues(schema.properties) : []
	const renderedByDiscriminator: string[] = []
	if (schema.discriminator) {
		renderedByDiscriminator.push(schema.discriminator.serializedName)
	}
	if (schema.discriminatorValues) {
		for (const dv of schema.discriminatorValues) {
			if (dv.discriminator) {
				renderedByDiscriminator.push(dv.discriminator.serializedName)
			}
		}
	}
	return properties.filter(p => renderedByDiscriminator.indexOf(p.serializedName) === -1)
}
