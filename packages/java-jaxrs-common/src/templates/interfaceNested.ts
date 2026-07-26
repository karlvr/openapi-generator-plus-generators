import { CodegenInterfaceSchema } from '@openapi-generator-plus/types'
import { ts, className } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from './types'
import { pojoDocumentation } from './frag/pojoDocumentation'
import { pojoHeader } from './frag/pojoHeader'
import { interfaceExtends } from './interfaceExtends'
import { interfaceContents } from './interfaceContents'

/** A nested interface, declared within an enclosing schema's `schemas`. */
export function interfaceNested(schema: CodegenInterfaceSchema, ctx: JavaModelContext): string {
	const name = className(ctx.generatorContext.generator(), schema.name)
	return ts`
${pojoDocumentation(schema)}
${pojoHeader(schema, ctx)}
public interface ${name} ${interfaceExtends(schema)}{

	${interfaceContents(schema, ctx)}
}
`
}
