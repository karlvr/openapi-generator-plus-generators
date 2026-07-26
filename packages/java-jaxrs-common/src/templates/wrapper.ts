import { CodegenWrapperSchema } from '@openapi-generator-plus/types'
import { ts, className } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from './types'
import { pojoDocumentation } from './frag/pojoDocumentation'
import { generatedAnnotation } from './generatedAnnotation'
import { wrapperHeader } from './frag/wrapperHeader'
import { pojoImplements } from './frag/pojoImplements'
import { wrapperContents } from './wrapperContents'

/** A top-level wrapper class, one Java source file per wrapper schema. */
export function wrapper(schema: CodegenWrapperSchema, ctx: JavaModelContext): string {
	const name = className(ctx.generatorContext.generator(), schema.name)
	return ts`
package ${ctx.root.modelPackage};

${pojoDocumentation(schema)}
${generatedAnnotation(ctx.root)}
${wrapperHeader(schema, ctx)}
public class ${name} ${pojoImplements(schema, schema.nativeType.nativeType, ctx)}{

	${wrapperContents(schema, ctx)}
}
`
}
