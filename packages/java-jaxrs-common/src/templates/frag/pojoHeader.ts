import { CodegenInterfaceSchema, CodegenObjectSchema, isCodegenObjectSchema } from '@openapi-generator-plus/types'
import { join, stringLiteral, SKIP, Skip } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from '../types'

/** A dynamically-added flag (set during `postProcessSchema`) recording that a polymorphic schema can't use Jackson's DEDUCTION strategy. */
interface WithCannotUseDeduction {
	__cannotUseDeduction?: boolean
}

function jsonTypeInfoLine(schema: CodegenObjectSchema | CodegenInterfaceSchema, ctx: JavaModelContext): string {
	const vendorUse = schema.vendorExtensions?.['x-openapi-generator-plus-java-jackson-use']
	const use = vendorUse !== undefined
		? String(vendorUse)
		: ((schema as CodegenObjectSchema & WithCannotUseDeduction).__cannotUseDeduction ? 'NONE' : 'DEDUCTION')
	return `@com.fasterxml.jackson.annotation.JsonTypeInfo(use = com.fasterxml.jackson.annotation.JsonTypeInfo.Id.${use})`
}

/**
 * The Jackson polymorphism annotations for a pojo or interface declaration
 * (from its discriminator, or its own polymorphic children/implementors when
 * there's no explicit discriminator), plus the `pojoHeaderAnnotations` hook
 * and a `@Deprecated` annotation when applicable.
 */
export function pojoHeader(schema: CodegenObjectSchema | CodegenInterfaceSchema, ctx: JavaModelContext): string | Skip {
	const lines: (string | Skip)[] = [ctx.templates.pojoHeaderAnnotations(schema, ctx)]

	if (schema.serializedName) {
		lines.push(`@${ctx.root.useJakarta ? 'jakarta' : 'javax'}.xml.bind.annotation.XmlRootElement(name = ${stringLiteral(ctx.generatorContext, schema.serializedName)})`)
	}

	if (schema.discriminator) {
		const discriminator = schema.discriminator
		lines.push(`@com.fasterxml.jackson.annotation.JsonTypeInfo(use = com.fasterxml.jackson.annotation.JsonTypeInfo.Id.NAME, include = com.fasterxml.jackson.annotation.JsonTypeInfo.As.PROPERTY, property = ${stringLiteral(ctx.generatorContext, discriminator.serializedName)})`)
		if (discriminator.references.length > 0) {
			lines.push('@com.fasterxml.jackson.annotation.JsonSubTypes({')
			for (const ref of discriminator.references) {
				lines.push(`\t@com.fasterxml.jackson.annotation.JsonSubTypes.Type(value = ${ref.schema.nativeType.literalType}.class, name = ${stringLiteral(ctx.generatorContext, ref.value)}),`)
			}
			lines.push('})')
		}
	} else if (isCodegenObjectSchema(schema) && schema.polymorphic && schema.children && schema.children.length > 0) {
		lines.push(jsonTypeInfoLine(schema, ctx))
		lines.push('@com.fasterxml.jackson.annotation.JsonSubTypes({')
		for (const child of schema.children) {
			lines.push(`\t@com.fasterxml.jackson.annotation.JsonSubTypes.Type(value = ${child.nativeType.literalType}.class, name = ${stringLiteral(ctx.generatorContext, child.name)}),`)
		}
		lines.push('})')
	} else if (!isCodegenObjectSchema(schema) && schema.polymorphic && schema.implementors && schema.implementors.length > 0) {
		lines.push(jsonTypeInfoLine(schema, ctx))
		lines.push('@com.fasterxml.jackson.annotation.JsonSubTypes({')
		for (const impl of schema.implementors) {
			lines.push(`\t@com.fasterxml.jackson.annotation.JsonSubTypes.Type(value = ${impl.nativeType.literalType}.class, name = ${stringLiteral(ctx.generatorContext, impl.name ?? '')}),`)
		}
		lines.push('})')
	}

	if (schema.deprecated) {
		lines.push('@java.lang.Deprecated')
	}

	return join(lines, '\n')
}
