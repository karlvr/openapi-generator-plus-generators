import { CodegenEnumSchema } from '@openapi-generator-plus/types'
import { ts, className } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from './types'
import { pojoDocumentation } from './frag/pojoDocumentation'
import { generatedAnnotation } from './generatedAnnotation'
import { enumHeader } from './frag/enumHeader'
import { enumImplements } from './frag/enumImplements'
import { enumContents } from './enumContents'

/** A top-level enum, one Java source file per enum schema. */
export function enumTemplate(schema: CodegenEnumSchema, ctx: JavaModelContext): string {
	const name = className(ctx.generatorContext.generator(), schema.name)
	return ts`
package ${ctx.root.modelPackage};

${pojoDocumentation(schema)}
${generatedAnnotation(ctx.root)}
${enumHeader(schema, ctx)}
public enum ${name} ${enumImplements(schema, schema.nativeType.nativeType, ctx)}{
	${enumContents(schema, ctx)}
}
`
}
