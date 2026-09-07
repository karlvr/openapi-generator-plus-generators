import { CodegenGenerator, CodegenHeader, CodegenNativeType, CodegenParameter, CodegenProperty, CodegenSchemaType } from '@openapi-generator-plus/types'
import { capitalize } from '@openapi-generator-plus/template-utils'

/**
 * A property, parameter or response header — the three kinds of named, schema-typed
 * value whose accessor method names {@link getter}/{@link setter} compute.
 */
export type CodegenPropertyLike = CodegenProperty | CodegenParameter | CodegenHeader

/**
 * Whether `property` is a required, non-nullable boolean, and so should use
 * Java's primitive `boolean` rather than the boxed `Boolean` type. Lombok
 * gives such properties a getter prefixed with `is` rather than `get`, and
 * drops a leading `is` from the property's own field name to avoid a doubled
 * prefix (see {@link lombokPropertyName}).
 */
export function isPrimitiveBool(property: CodegenPropertyLike): boolean {
	return property.schema.schemaType === CodegenSchemaType.BOOLEAN && property.required && !property.nullable
}

/**
 * The Java primitive that this generator writes in place of each boxed type, for a value that
 * is always present.
 *
 * A boxed type carries null, and a value that is required and not nullable never is. So the
 * primitive says more about the value, and costs less.
 */
export const JAVA_PRIMITIVE_TYPES: Readonly<Record<string, string>> = {
	'java.lang.Integer': 'int',
	'java.lang.Boolean': 'boolean',
	'java.lang.Long': 'long',
	'java.lang.Float': 'float',
	'java.lang.Double': 'double',
	'java.lang.Byte': 'byte',
}

/**
 * Whether this generator writes `property` as a Java primitive.
 *
 * A primitive always holds a value, so a comparison with null does not compile. Use this before
 * writing code that tests whether a value is present.
 */
export function isPrimitive(property: CodegenProperty | CodegenParameter): boolean {
	return Object.values(JAVA_PRIMITIVE_TYPES).includes(property.nativeType.nativeType)
}

/**
 * Lombok has special treatment for boolean properties that have a prefix of "is".
 * e.g. isAdmin would have `@Getter isAdmin()`, `@Setter setAdmin()`
 * instead of `@Getter isIsAdmin()`, `@Setter setIsAdmin()`
 * See https://projectlombok.org/features/GetterSetter
 */
export function lombokPropertyName(property: CodegenPropertyLike, propertyName: string): string {
	if (isPrimitiveBool(property)) {
		return propertyName.replace(/^is(?=[A-Z])/, '')
	} else {
		return propertyName
	}
}

/**
 * The name of the getter method for `property`, honouring Lombok's `is`
 * prefix for primitive booleans and its field-name adjustment when Lombok is
 * in use.
 */
export function getter(property: CodegenPropertyLike, generator: CodegenGenerator, useLombok: boolean): string {
	let propertyName = generator.toIdentifier(property.name)
	if (useLombok) {
		propertyName = lombokPropertyName(property, propertyName)
	}
	if (isPrimitiveBool(property)) {
		return `is${capitalize(propertyName)}`
	} else {
		return `get${capitalize(propertyName)}`
	}
}

/**
 * The name of the setter method for `property`, honouring Lombok's
 * field-name adjustment when Lombok is in use.
 */
export function setter(property: CodegenPropertyLike, generator: CodegenGenerator, useLombok: boolean): string {
	let propertyName = generator.toIdentifier(property.name)
	if (useLombok) {
		propertyName = lombokPropertyName(property, propertyName)
	}
	return `set${capitalize(propertyName)}`
}

/** Whether `nativeType` is a Java array type, e.g. `byte[]`. */
export function isNativeArray(nativeType: CodegenNativeType): boolean {
	return nativeType.nativeType.endsWith('[]')
}

/** `jakarta` or `javax`, according to the generator's `useJakarta` option. */
export function javax(useJakarta: boolean): string {
	return useJakarta ? 'jakarta' : 'javax'
}

/** Escape `value` for use inside a Java string literal's quotes (backslash, double-quote, CR and LF). */
export function escapeString(value: string | number | boolean): string {
	if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
		throw new Error(`escapeString called with unsupported type: ${typeof value} (${value})`)
	}

	let result = String(value)
	result = result.replace(/\\/g, '\\\\')
	result = result.replace(/"/g, '\\"')
	result = result.replace(/\r/g, '\\r')
	result = result.replace(/\n/g, '\\n')
	return result
}
