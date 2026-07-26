import { CodegenWrapperSchema } from '@openapi-generator-plus/types'
import { className, identifier, SKIP } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from './types'
import { propertyDocumentation } from './frag/propertyDocumentation'
import { pojoPropertyAnnotations } from './frag/pojoPropertyAnnotations'
import { pojoPropertyType } from './frag/pojoPropertyType'
import { pojoProperty } from './frag/pojoProperty'
import { pojoUtilities } from './frag/pojoUtilities'
import { setter } from './helpers'

/**
 * The body of a wrapper class: its single wrapped property (annotated as the
 * `@JsonValue`), that property's chaining setter/accessors, a `@JsonCreator`
 * static factory method, and the shared `equals`/`hashCode`/`toString`
 * utilities.
 */
export function wrapperContents(schema: CodegenWrapperSchema, ctx: JavaModelContext): string {
	const generator = ctx.generatorContext.generator()
	const property = schema.property
	const name = identifier(generator, property.name)
	const wrapperName = className(generator, schema.name)

	const doc = propertyDocumentation(property)
	const annotations = pojoPropertyAnnotations(property, ctx, '@com.fasterxml.jackson.annotation.JsonValue')
	const initialValue = property.initialValue ? ` = ${property.initialValue.literalValue}` : ''

	let result = ''
	if (doc !== SKIP) {
		result += doc + '\n'
	}
	if (annotations !== SKIP) {
		result += annotations + '\n'
	}
	if (ctx.root.useLombok) {
		result += '@lombok.Getter\n@lombok.Setter\n'
	}
	result += `private ${pojoPropertyType(property)} ${name}${initialValue};

`
	result += pojoProperty(property, wrapperName, ctx)
	result += `@com.fasterxml.jackson.annotation.JsonCreator
public static ${schema.nativeType} create${wrapperName}(${pojoPropertyType(property)} ${name}) {
	${schema.nativeType} result = new ${wrapperName}();
	result.${setter(property, generator, ctx.root.useLombok)}(${name});
	return result;
}

`

	const utilities = pojoUtilities(schema, ctx)
	if (utilities !== SKIP) {
		result += utilities
	}

	/* This content is embedded at "\t${...}\n}" in the enclosing class declaration
	   (see wrapper.ts/wrapperNested.ts), which itself supplies the newline before
	   that closing brace, so normalize to exactly one trailing newline here. */
	return result.replace(/\n+$/, '\n')
}
