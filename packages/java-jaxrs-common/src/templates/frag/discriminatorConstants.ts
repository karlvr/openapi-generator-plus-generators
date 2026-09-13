import { CodegenObjectSchema, CodegenProperty } from '@openapi-generator-plus/types'
import * as idx from '@openapi-generator-plus/indexed-type'
import { identifier, inheritedProperties } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from '../types'

/**
 * A discriminator property that a pojo holds one fixed value for, because the pojo
 * is a member of that discriminator.
 *
 * The schema that declares the property holds a variable, as a caller may reach it
 * on its own. A member holds the value that names the member. The pojo of a member
 * sets that value in its constructor, so a caller need not. The setter stays the
 * plain one, so a caller who sets another value has asked for it, and the client
 * sends it.
 */
export interface DiscriminatorConstant {
	/** The property, from this schema or from a parent. */
	property: CodegenProperty
	/** The value that names this member, as a Java literal. */
	literalValue: string
}

/**
 * The discriminator constants of a pojo. Empty for a pojo that is not a member of a discriminator.
 *
 * A pojo may be a member of more than one discriminator on one property. When those discriminators
 * disagree on the value, no one value names the pojo, so the property has no constant and the
 * caller sets it.
 */
export function discriminatorConstants(schema: CodegenObjectSchema): DiscriminatorConstant[] {
	const literalValues = new Map<string, Set<string>>()
	for (const dv of schema.discriminatorValues ?? []) {
		if (dv.discriminator) {
			const serializedName = dv.discriminator.serializedName
			const values = literalValues.get(serializedName) ?? new Set<string>()
			values.add(dv.literalValue)
			literalValues.set(serializedName, values)
		}
	}

	const result: DiscriminatorConstant[] = []
	for (const [serializedName, values] of literalValues) {
		if (values.size !== 1) {
			continue
		}
		const literalValue = [...values][0]
		const ownProperty = schema.properties ? idx.get(schema.properties, serializedName) : undefined
		const property = ownProperty ?? inheritedProperties(schema).find(p => p.serializedName === serializedName)
		if (property) {
			result.push({ property, literalValue })
		}
	}
	return result
}

/**
 * The lines of a constructor body that set each discriminator constant.
 *
 * The constructor calls the chaining setter, which wraps a nullable value in an
 * `Optional`, and which reaches a field that a parent declares.
 */
export function discriminatorConstructorLines(constants: DiscriminatorConstant[], ctx: JavaModelContext): string[] {
	const generator = ctx.generatorContext.generator()
	return constants.map(constant => `\t${identifier(generator, constant.property.name)}(${constant.literalValue});`)
}
