import { CodegenArraySchema, CodegenEncodingStyle, CodegenLogLevel, CodegenObjectSchema, CodegenProperty } from '@openapi-generator-plus/types'
import { allProperties, capitalize, indent, stringLiteral } from '@openapi-generator-plus/template-utils'
import { getter, isPrimitive, JavaModelContext } from '@openapi-generator-plus/java-jaxrs-generator-common'

/** The name of the generated method that encodes the request body whose type is `nativeType`. */
export function encoderName(nativeType: string): string {
	const simpleNames = nativeType.split('.').filter(part => /^[A-Z]/.test(part))
	const names = simpleNames.length > 0 ? simpleNames : [nativeType]
	return `encode${names.map(name => capitalize(name.replace(/[^A-Za-z0-9]/g, ''))).join('')}`
}

/** The expression that reads `property` from the model held in `modelVar`. */
export function accessor(property: CodegenProperty, modelVar: string, ctx: JavaModelContext): string {
	return `${modelVar}.${getter(property, ctx.generatorContext.generator(), ctx.root.useLombok)}()`
}

/** The Java type of one element of the array that `property` holds. */
export function componentType(property: CodegenProperty): string {
	const component = (property.schema as CodegenArraySchema).component
	return String(component.nativeType.componentType ?? component.nativeType)
}

/** The properties that an object-valued property holds, in declaration order. */
export function objectProperties(property: CodegenProperty): CodegenProperty[] {
	return allProperties(property.schema as CodegenObjectSchema)
}

/**
 * A Java `if` statement that runs `body` when `condition` holds.
 *
 * `body` holds whole statements, and ends with a newline. So does the result, which lets a
 * caller concatenate blocks.
 */
export function guard(condition: string, body: string): string {
	return `if (${condition}) {\n${indent(body, '\t')}}\n`
}

/**
 * The statements that read a value which may be absent, and may be null.
 *
 * `body` renders the statements for a value that is present, and takes the expression that
 * reads it. `whenNull` renders the statements for a null value. An encoding that has no place
 * to put a null omits the value, and so passes no `whenNull`.
 *
 * A primitive always holds a value, so its statements run unguarded.
 */
export function present(property: CodegenProperty, access: string, body: (value: string) => string, whenNull?: string): string {
	if (isPrimitive(property)) {
		return body(access)
	}
	if (!property.nullable) {
		return guard(`${access} != null`, body(access))
	}
	if (whenNull === undefined) {
		return guard(`${access} != null && ${access}.isPresent()`, body(`${access}.get()`))
	}
	const branches = `if (${access}.isPresent()) {\n${indent(body(`${access}.get()`), '\t')}} else {\n${indent(whenNull, '\t')}}\n`
	return guard(`${access} != null`, branches)
}

/** A Java string literal holding the name that the API declares for `property`. */
export function nameLiteral(property: CodegenProperty, ctx: JavaModelContext): string {
	return stringLiteral(ctx.generatorContext, property.serializedName)
}

/**
 * How a style writes a value that holds more than one part.
 *
 * `join` writes one value, with the parts separated. `explode` writes one value for each part,
 * under its own name. `deepObject` writes one value for each part, under a name that holds both
 * the name of the value and the name of the part. `unsupported` is a style that this generator
 * cannot write.
 */
export type EncodingShape =
	| { kind: 'join'; separator: string; keyValueSeparator: string }
	| { kind: 'explode' }
	| { kind: 'deepObject' }
	| { kind: 'unsupported' }

/** How the style writes the elements of an array. */
export function arrayShape(style: CodegenEncodingStyle | null, explode: boolean, ctx: JavaModelContext): EncodingShape {
	switch (style ?? CodegenEncodingStyle.FORM) {
		case CodegenEncodingStyle.FORM:
			return explode ? { kind: 'explode' } : { kind: 'join', separator: ',', keyValueSeparator: ',' }
		case CodegenEncodingStyle.SPACE_DELIMITED:
			return { kind: 'join', separator: ' ', keyValueSeparator: ' ' }
		case CodegenEncodingStyle.PIPE_DELIMITED:
			return { kind: 'join', separator: '|', keyValueSeparator: '|' }
		case CodegenEncodingStyle.SIMPLE:
			return { kind: 'join', separator: ',', keyValueSeparator: ',' }
		default:
			ctx.generatorContext.log(CodegenLogLevel.WARN, `Array encoding style ${style} not supported`)
			return { kind: 'unsupported' }
	}
}

/** How the style writes the properties of an object. */
export function objectShape(style: CodegenEncodingStyle | null, explode: boolean, ctx: JavaModelContext): EncodingShape {
	switch (style ?? CodegenEncodingStyle.FORM) {
		case CodegenEncodingStyle.FORM:
			return explode ? { kind: 'explode' } : { kind: 'join', separator: ',', keyValueSeparator: ',' }
		case CodegenEncodingStyle.SPACE_DELIMITED:
			return { kind: 'join', separator: ' ', keyValueSeparator: ' ' }
		case CodegenEncodingStyle.PIPE_DELIMITED:
			return { kind: 'join', separator: '|', keyValueSeparator: '|' }
		case CodegenEncodingStyle.SIMPLE:
			return explode ? { kind: 'join', separator: ',', keyValueSeparator: '=' } : { kind: 'join', separator: ',', keyValueSeparator: ',' }
		case CodegenEncodingStyle.DEEP_OBJECT:
			return { kind: 'deepObject' }
		default:
			ctx.generatorContext.log(CodegenLogLevel.WARN, `Object encoding style ${style} not supported`)
			return { kind: 'unsupported' }
	}
}

/** The statement that reports a style that this generator cannot write. */
export function unsupportedStyle(style: CodegenEncodingStyle | null): string {
	return `throw new java.lang.UnsupportedOperationException("Unsupported parameter encoding: ${style ?? 'none'}");\n`
}
