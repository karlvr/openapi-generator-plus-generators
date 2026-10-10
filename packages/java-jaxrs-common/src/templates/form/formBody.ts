import { CodegenContentPropertyEncoding, CodegenProperty, CodegenRequestBody } from '@openapi-generator-plus/types'
import * as idx from '@openapi-generator-plus/indexed-type'
import { isArray, isObject, indent, stringLiteral } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from '../types'
import { accessor, arrayShape, componentType, nameLiteral, objectProperties, objectShape, present, unsupportedStyle } from './encoding'

/** The local that holds the form body while the generated statements fill it. */
export const FORM = '__form'

/**
 * How a client library builds an `application/x-www-form-urlencoded` body.
 *
 * JAX-RS and OkHttp each have their own builder, and name the method that adds a pair their
 * own way, but the styles that the API declares are the same for both. So a generator supplies
 * these three parts and shares the rest.
 */
export interface FormBodyBuilder {
	/**
	 * The statement that declares the builder, under the name that {@link FORM} gives.
	 * Ends with a newline.
	 */
	declare: string
	/** The statement that writes one name and one value into the builder. Ends with a newline. */
	add: (name: string, value: string) => string
	/** The statement that finishes the builder, which is the last of the generated statements. */
	finish: string
	/** An expression giving the text form of `value`, which is empty for null. */
	text: (value: string) => string
	/** An expression giving the elements of `values` with `separator` between them. */
	join: (values: string, separator: string) => string
}

/** The statements that write an array property, one value for each element. */
function explodedArray(entry: CodegenContentPropertyEncoding, value: string, builder: FormBodyBuilder, ctx: JavaModelContext): string {
	const name = nameLiteral(entry.property, ctx)
	const element = builder.add(name, builder.text('__element'))
	return `for (${componentType(entry.property)} __element : ${value}) {\n${indent(element, '\t')}}\n`
}

/**
 * The statements that write an array property.
 *
 * A null array writes an empty value, whichever style writes it. A style that writes one value
 * has a place to put the empty value, and a style that explodes writes the name of the array
 * itself, so it has one too. So a null array stays distinct from an absent one.
 */
function arrayProperty(entry: CodegenContentPropertyEncoding, access: string, builder: FormBodyBuilder, ctx: JavaModelContext): string {
	const name = nameLiteral(entry.property, ctx)
	const shape = arrayShape(entry.style, entry.explode, ctx)
	switch (shape.kind) {
		case 'explode':
			return present(entry.property, access, value => explodedArray(entry, value, builder, ctx), builder.add(name, '""'))
		case 'join': {
			const joined = (value: string) => builder.add(name, builder.join(value, stringLiteral(ctx.generatorContext, shape.separator)))
			return present(entry.property, access, joined, builder.add(name, '""'))
		}
		default:
			return unsupportedStyle(entry.style)
	}
}

/** The statement that writes one property of an object under its own name. */
function objectPropertyValue(property: CodegenProperty, access: string, name: string, builder: FormBodyBuilder): string {
	return present(property, access, value => builder.add(name, builder.text(value)), builder.add(name, '""'))
}

/** The statements that write an object property, one value for each of its own properties. */
function explodedObject(entry: CodegenContentPropertyEncoding, value: string, builder: FormBodyBuilder, ctx: JavaModelContext, prefix?: string): string {
	const modelVar = '__object'
	const declaration = `${entry.property.nativeType} ${modelVar} = ${value};\n`
	const lines = objectProperties(entry.property).map(property => {
		const name = prefix !== undefined
			? stringLiteral(ctx.generatorContext, `${prefix}[${property.serializedName}]`)
			: nameLiteral(property, ctx)
		return objectPropertyValue(property, accessor(property, modelVar, ctx), name, builder)
	}).join('')
	return `${declaration}${lines}`
}

/** The statements that write an object property as one value, which names each property in turn. */
function joinedObject(entry: CodegenContentPropertyEncoding, value: string, separator: string, keyValueSeparator: string, builder: FormBodyBuilder, ctx: JavaModelContext): string {
	const modelVar = '__object'
	const pairsVar = '__pairs'
	const lines = objectProperties(entry.property).map(property => {
		const access = accessor(property, modelVar, ctx)
		const key = stringLiteral(ctx.generatorContext, `${property.serializedName}${keyValueSeparator}`)
		const pair = (value: string) => `${pairsVar}.add(${key} + ${builder.text(value)});\n`
		return present(property, access, pair, `${pairsVar}.add(${key});\n`)
	}).join('')

	return `${entry.property.nativeType} ${modelVar} = ${value};\n`
		+ `java.util.List<java.lang.String> ${pairsVar} = new java.util.ArrayList<>();\n`
		+ lines
		+ builder.add(nameLiteral(entry.property, ctx), `java.lang.String.join(${stringLiteral(ctx.generatorContext, separator)}, ${pairsVar})`)
}

/**
 * The statements that write an object property.
 *
 * An exploded object and a `deepObject` write the name of each property rather than the name of
 * the object. Neither has a place to put a null object, so a null object is omitted. A style
 * that writes one value does have a place, and writes an empty value.
 */
function objectProperty(entry: CodegenContentPropertyEncoding, access: string, builder: FormBodyBuilder, ctx: JavaModelContext): string {
	const shape = objectShape(entry.style, entry.explode, ctx)
	switch (shape.kind) {
		case 'join': {
			const joined = (value: string) => joinedObject(entry, value, shape.separator, shape.keyValueSeparator, builder, ctx)
			return present(entry.property, access, joined, builder.add(nameLiteral(entry.property, ctx), '""'))
		}
		case 'explode':
			return present(entry.property, access, value => explodedObject(entry, value, builder, ctx))
		case 'deepObject':
			return present(entry.property, access, value => explodedObject(entry, value, builder, ctx, entry.property.serializedName))
		default:
			return unsupportedStyle(entry.style)
	}
}

/** The statements that write one property of the request model into the form body. */
function formProperty(entry: CodegenContentPropertyEncoding, modelVar: string, builder: FormBodyBuilder, ctx: JavaModelContext): string {
	const access = accessor(entry.property, modelVar, ctx)
	if (isArray(entry.property)) {
		return arrayProperty(entry, access, builder, ctx)
	}
	if (isObject(entry.property)) {
		return objectProperty(entry, access, builder, ctx)
	}

	/* A form encoding carries text, which has no null, so an empty value stands for null */
	return objectPropertyValue(entry.property, access, nameLiteral(entry.property, ctx), builder)
}

/**
 * The statements that build an `application/x-www-form-urlencoded` body from the request model,
 * in the styles that the API declares for each of its properties.
 *
 * The model is held in `modelVar`. `builder` says how the client library builds the body, and
 * its `finish` is the last statement. The statements need `text` and `join` in scope.
 *
 * A request body that is not required may be null. The statements then build an empty body.
 */
export function formBodyStatements(requestBody: CodegenRequestBody, modelVar: string, builder: FormBodyBuilder, ctx: JavaModelContext): string {
	const properties = requestBody.defaultContent.encoding?.properties ? idx.allValues(requestBody.defaultContent.encoding.properties) : []
	const lines = properties.map(entry => formProperty(entry, modelVar, builder, ctx)).join('')
	const guarded = requestBody.required || !lines
		? lines
		: `if (${modelVar} != null) {\n${indent(lines, '\t')}}\n`
	return builder.declare
		+ guarded
		+ builder.finish
}
