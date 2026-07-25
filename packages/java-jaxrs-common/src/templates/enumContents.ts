import { CodegenEnumSchema } from '@openapi-generator-plus/types'
import * as idx from '@openapi-generator-plus/indexed-type'
import { className, stringLiteral, md, indentTail, SKIP, Skip } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from './types'

/** An enum value's documentation comment, or SKIP if it has no description. */
function enumValueDoc(description: string | null): string | Skip {
	if (!description) {
		return SKIP
	}
	return `/**\n * ${indentTail(md(description), ' * ')}\n */`
}

/**
 * The body of an enum: the `enumHeader` hook, each value (with its
 * `@XmlEnumValue` annotation and optional doc comment), the `value` field and
 * constructor, `value()`/`toString()`/`fromValue()` methods, and the
 * `enumFooter` hook.
 */
export function enumContents(schema: CodegenEnumSchema, ctx: JavaModelContext): string {
	const jx = ctx.root.useJakarta ? 'jakarta' : 'javax'
	const name = className(ctx.generatorContext.generator(), schema.name)
	const values = schema.enumValues ? idx.allValues(schema.enumValues) : []

	const header = ctx.templates.enumHeader(schema, ctx)

	let result = ''
	if (header !== SKIP) {
		result += header + '\n'
	}
	for (const value of values) {
		const doc = enumValueDoc(value.description)
		if (doc !== SKIP) {
			result += doc + '\n'
		}
		result += `@${jx}.xml.bind.annotation.XmlEnumValue(${stringLiteral(ctx.generatorContext, value.value)}) ${value.name}(${value.literalValue}),\n`
	}
	if (values.length > 0) {
		result += ';\n'
	}

	result += `
private ${schema.enumValueNativeType} value;

${name}(${schema.enumValueNativeType} v) {
	value = v;
}

@com.fasterxml.jackson.annotation.JsonValue
public ${schema.enumValueNativeType} value() {
	return value;
}

@java.lang.Override
public java.lang.String toString() {
	return java.lang.String.valueOf(value);
}

/**
 * Return the ${name} that has the given {@link #value()} by matching
 * its string representation.
 */
public static ${name} fromValue(java.lang.String v) {
	for (${name} b : ${name}.values()) {
		if (java.lang.String.valueOf(b.value).equals(v)) {
			return b;
		}
	}
	throw new java.lang.IllegalArgumentException("Unsupported ${name} value: " + v);
}

`

	const footer = ctx.templates.enumFooter(schema, ctx)
	if (footer !== SKIP) {
		result += footer + '\n'
	}

	/* This content is embedded at "\t${...}\n}" in the enclosing enum declaration
	   (see enum.ts/enumNested.ts), which itself supplies the newline before that
	   closing brace, so normalize to exactly one trailing newline here. */
	return result.replace(/\n+$/, '\n')
}
