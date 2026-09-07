import { CodegenContentPropertyEncoding, CodegenProperty, CodegenRequestBody } from '@openapi-generator-plus/types'
import * as idx from '@openapi-generator-plus/indexed-type'
import { isArray, isObject, indent, stringLiteral } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { accessor, arrayShape, componentType, nameLiteral, objectProperties, objectShape, present, unsupportedStyle } from './encoding'

/** The builder that the generated method fills. */
const FORM = '__form'

/** The statement that writes one name and value into the form body. */
function add(name: string, value: string): string {
	return `${FORM}.add(${name}, ${value});\n`
}

/** The statements that write an array property, one value for each element. */
function explodedArray(entry: CodegenContentPropertyEncoding, value: string, ctx: JavaModelContext): string {
	const name = nameLiteral(entry.property, ctx)
	const element = add(name, 'text(__element)')
	return `for (${componentType(entry.property)} __element : ${value}) {\n${indent(element, '\t')}}\n`
}

/**
 * The statements that write an array property.
 *
 * A null array writes an empty value, whichever style writes it. A style that writes one value
 * has a place to put the empty value, and a style that explodes writes the name of the array
 * itself, so it has one too. So a null array stays distinct from an absent one.
 */
function arrayProperty(entry: CodegenContentPropertyEncoding, access: string, ctx: JavaModelContext): string {
	const name = nameLiteral(entry.property, ctx)
	const shape = arrayShape(entry.style, entry.explode, ctx)
	switch (shape.kind) {
		case 'explode':
			return present(entry.property, access, value => explodedArray(entry, value, ctx), add(name, '""'))
		case 'join': {
			const joined = (value: string) => add(name, `join(${value}, ${stringLiteral(ctx.generatorContext, shape.separator)})`)
			return present(entry.property, access, joined, add(name, '""'))
		}
		default:
			return unsupportedStyle(entry.style)
	}
}

/** The statement that writes one property of an object under its own name. */
function objectPropertyValue(property: CodegenProperty, access: string, name: string): string {
	return present(property, access, value => add(name, `text(${value})`), add(name, '""'))
}

/** The statements that write an object property, one value for each of its own properties. */
function explodedObject(entry: CodegenContentPropertyEncoding, value: string, ctx: JavaModelContext, prefix?: string): string {
	const modelVar = '__object'
	const declaration = `${entry.property.nativeType} ${modelVar} = ${value};\n`
	const lines = objectProperties(entry.property).map(property => {
		const name = prefix !== undefined
			? stringLiteral(ctx.generatorContext, `${prefix}[${property.serializedName}]`)
			: nameLiteral(property, ctx)
		return objectPropertyValue(property, accessor(property, modelVar, ctx), name)
	}).join('')
	return `${declaration}${lines}`
}

/** The statements that write an object property as one value, which names each property in turn. */
function joinedObject(entry: CodegenContentPropertyEncoding, value: string, separator: string, keyValueSeparator: string, ctx: JavaModelContext): string {
	const modelVar = '__object'
	const pairsVar = '__pairs'
	const lines = objectProperties(entry.property).map(property => {
		const access = accessor(property, modelVar, ctx)
		const key = stringLiteral(ctx.generatorContext, `${property.serializedName}${keyValueSeparator}`)
		const pair = (value: string) => `${pairsVar}.add(${key} + text(${value}));\n`
		return present(property, access, pair, `${pairsVar}.add(${key});\n`)
	}).join('')

	return `${entry.property.nativeType} ${modelVar} = ${value};\n`
		+ `java.util.List<java.lang.String> ${pairsVar} = new java.util.ArrayList<>();\n`
		+ lines
		+ add(nameLiteral(entry.property, ctx), `java.lang.String.join(${stringLiteral(ctx.generatorContext, separator)}, ${pairsVar})`)
}

/**
 * The statements that write an object property.
 *
 * An exploded object and a `deepObject` write the name of each property rather than the name of
 * the object. Neither has a place to put a null object, so a null object is omitted. A style
 * that writes one value does have a place, and writes an empty value.
 */
function objectProperty(entry: CodegenContentPropertyEncoding, access: string, ctx: JavaModelContext): string {
	const shape = objectShape(entry.style, entry.explode, ctx)
	switch (shape.kind) {
		case 'join': {
			const joined = (value: string) => joinedObject(entry, value, shape.separator, shape.keyValueSeparator, ctx)
			return present(entry.property, access, joined, add(nameLiteral(entry.property, ctx), '""'))
		}
		case 'explode':
			return present(entry.property, access, value => explodedObject(entry, value, ctx))
		case 'deepObject':
			return present(entry.property, access, value => explodedObject(entry, value, ctx, entry.property.serializedName))
		default:
			return unsupportedStyle(entry.style)
	}
}

/** The statements that write one property of the request model into the form body. */
function formProperty(entry: CodegenContentPropertyEncoding, modelVar: string, ctx: JavaModelContext): string {
	const access = accessor(entry.property, modelVar, ctx)
	if (isArray(entry.property)) {
		return arrayProperty(entry, access, ctx)
	}
	if (isObject(entry.property)) {
		return objectProperty(entry, access, ctx)
	}

	/* A form encoding carries text, which has no null, so an empty value stands for null */
	return objectPropertyValue(entry.property, access, nameLiteral(entry.property, ctx))
}

/**
 * The statements that build an `application/x-www-form-urlencoded` body from the request model.
 *
 * The model is held in `modelVar`. The last statement returns the body.
 */
export function formBodyStatements(requestBody: CodegenRequestBody, modelVar: string, ctx: JavaModelContext): string {
	const properties = requestBody.defaultContent.encoding?.properties ? idx.allValues(requestBody.defaultContent.encoding.properties) : []
	return `okhttp3.FormBody.Builder ${FORM} = new okhttp3.FormBody.Builder();\n`
		+ properties.map(entry => formProperty(entry, modelVar, ctx)).join('')
		+ `return ${FORM}.build();\n`
}
