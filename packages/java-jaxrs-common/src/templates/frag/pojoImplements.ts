import { CodegenObjectSchema, CodegenWrapperSchema } from '@openapi-generator-plus/types'
import { join, SKIP, Skip } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from '../types'
import { customImplements } from './customImplements'

/**
 * The `implements` clause of a class declaration (with a trailing space, so
 * it can be interpolated directly before the opening brace), combining the
 * schema's own `implements` interfaces, the `x-implements-interfaces` vendor
 * extension, the `pojoImplementsExtras` hook, and any `customizations`
 * interfaces configured for `classNativeType`. Renders an empty string if
 * there is nothing to implement.
 */
export function pojoImplements(schema: CodegenObjectSchema | CodegenWrapperSchema, classNativeType: string, ctx: JavaModelContext): string {
	const parts: (string | Skip)[] = (schema.implements ?? []).map(iface => `${iface.nativeType.parentType}`)

	const vendorInterfaces = schema.vendorExtensions?.['x-implements-interfaces']
	if (vendorInterfaces !== undefined) {
		parts.push(String(vendorInterfaces))
	}
	parts.push(ctx.templates.pojoImplementsExtras(schema, ctx))
	parts.push(customImplements(classNativeType, ctx.root))

	const implementsList = join(parts, ', ')
	return implementsList === SKIP ? '' : `implements ${implementsList} `
}
