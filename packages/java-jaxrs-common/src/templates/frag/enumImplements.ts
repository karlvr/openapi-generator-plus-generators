import { CodegenEnumSchema } from '@openapi-generator-plus/types'
import { join, SKIP, Skip } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from '../types'
import { customImplements } from './customImplements'

/**
 * The `implements` clause of an enum declaration (with a trailing space),
 * combining the `x-implements-interfaces` vendor extension and any
 * `customizations` interfaces configured for `classNativeType`. Renders an
 * empty string if there is nothing to implement.
 */
export function enumImplements(schema: CodegenEnumSchema, classNativeType: string, ctx: JavaModelContext): string {
	const parts: (string | Skip)[] = []
	const vendorInterfaces = schema.vendorExtensions?.['x-implements-interfaces']
	if (vendorInterfaces !== undefined) {
		parts.push(String(vendorInterfaces))
	}
	parts.push(customImplements(classNativeType, ctx.root))

	const implementsList = join(parts, ', ')
	return implementsList === SKIP ? '' : `implements ${implementsList} `
}
