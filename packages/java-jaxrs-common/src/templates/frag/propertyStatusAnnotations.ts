import { CodegenProperty } from '@openapi-generator-plus/types'
import { SKIP, Skip } from '@openapi-generator-plus/template-utils'

/** The `@Deprecated` annotation line for a property, if it is deprecated. */
export function propertyStatusAnnotations(property: CodegenProperty): string | Skip {
	return property.deprecated ? '@java.lang.Deprecated' : SKIP
}
