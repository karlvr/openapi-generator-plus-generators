import { CodegenInterfaceSchema } from '@openapi-generator-plus/types'
import { ts, className } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from './types'
import { pojoDocumentation } from './frag/pojoDocumentation'
import { generatedAnnotation } from './generatedAnnotation'
import { pojoHeader } from './frag/pojoHeader'
import { interfaceExtends } from './interfaceExtends'
import { interfaceContents } from './interfaceContents'

/** A top-level interface, one Java source file per interface schema. */
export function interfaceTemplate(schema: CodegenInterfaceSchema, ctx: JavaModelContext): string {
	const name = className(ctx.generatorContext.generator(), schema.name)
	return ts`
package ${ctx.root.modelPackage};

${pojoDocumentation(schema)}
${generatedAnnotation(ctx.root)}
${pojoHeader(schema, ctx)}
public interface ${name} ${interfaceExtends(schema)}{

	${interfaceContents(schema, ctx)}
}
`
}
