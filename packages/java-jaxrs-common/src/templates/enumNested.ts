import { CodegenEnumSchema } from '@openapi-generator-plus/types'
import { ts, className } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from './types'
import { pojoDocumentation } from './frag/pojoDocumentation'
import { enumHeader } from './frag/enumHeader'
import { enumImplements } from './frag/enumImplements'
import { enumContents } from './enumContents'

/** A nested (static) enum, declared within an enclosing schema's `schemas`. */
export function enumNested(schema: CodegenEnumSchema, ctx: JavaModelContext): string {
	const name = className(ctx.generatorContext.generator(), schema.name)
	return ts`
${pojoDocumentation(schema)}
${enumHeader(schema, ctx)}
public enum ${name} ${enumImplements(schema, schema.nativeType.nativeType, ctx)}{
	${enumContents(schema, ctx)}
}
`
}
