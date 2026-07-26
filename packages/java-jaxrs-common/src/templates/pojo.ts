import { CodegenObjectSchema } from '@openapi-generator-plus/types'
import { ts, className, when } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from './types'
import { pojoDocumentation } from './frag/pojoDocumentation'
import { generatedAnnotation } from './generatedAnnotation'
import { pojoHeader } from './frag/pojoHeader'
import { pojoImplements } from './frag/pojoImplements'
import { pojoContents } from './pojoContents'

/** A top-level pojo class, one Java source file per object schema. */
export function pojo(schema: CodegenObjectSchema, ctx: JavaModelContext): string {
	const name = className(ctx.generatorContext.generator(), schema.name)
	const parent = schema.parents && schema.parents.length > 0 ? schema.parents[0] : null

	return ts`
package ${ctx.root.modelPackage};

${pojoDocumentation(schema)}
${generatedAnnotation(ctx.root)}
${pojoHeader(schema, ctx)}
${when(ctx.root.useLombok, () => ts`
@lombok.EqualsAndHashCode${parent ? '(callSuper = true)' : ''}
@lombok.ToString${parent ? '(callSuper = true)' : ''}`)}
public ${schema.abstract ? 'abstract ' : ''}class ${name}${parent ? ` extends ${parent.nativeType.concreteType}` : ''} ${pojoImplements(schema, schema.nativeType.nativeType, ctx)}{

	${pojoContents(schema, ctx)}
}
`
}
