import { CodegenWrapperSchema } from '@openapi-generator-plus/types'
import { ts, className } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from './types'
import { pojoDocumentation } from './frag/pojoDocumentation'
import { wrapperHeader } from './frag/wrapperHeader'
import { pojoImplements } from './frag/pojoImplements'
import { wrapperContents } from './wrapperContents'

/** A nested (static inner class) wrapper, declared within an enclosing schema's `schemas`. */
export function wrapperNested(schema: CodegenWrapperSchema, ctx: JavaModelContext): string {
	const name = className(ctx.generatorContext.generator(), schema.name)
	return ts`
${pojoDocumentation(schema)}
${wrapperHeader(schema, ctx)}
public static class ${name} ${pojoImplements(schema, schema.nativeType.nativeType, ctx)}{

	${wrapperContents(schema, ctx)}
}
`
}
