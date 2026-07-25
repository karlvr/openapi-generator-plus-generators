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
