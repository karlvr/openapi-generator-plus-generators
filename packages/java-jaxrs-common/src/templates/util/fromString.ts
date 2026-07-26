import { isString } from '@openapi-generator-plus/template-utils'
import { CodegenPropertyLike } from '../helpers'

/**
 * An expression that converts `value` (a `java.lang.String`) to the type of `property`.
 */
export function fromString(property: CodegenPropertyLike, value: string): string {
	if (isString(property)) {
		return value
	} else if (property.nativeType.toString() === 'java.math.BigDecimal') {
		return `new java.math.BigDecimal(${value})`
	} else {
		return `${property.nativeType.concreteType}.valueOf(${value})`
	}
}
