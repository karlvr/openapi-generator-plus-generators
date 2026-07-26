import { CodegenProperty } from '@openapi-generator-plus/types'

/** The Java type of a property, wrapped in `java.util.Optional` when the property is nullable. */
export function pojoPropertyType(property: CodegenProperty): string {
	return property.nullable ? `java.util.Optional<${property.nativeType}>` : `${property.nativeType}`
}
