import { CodegenSchema, CodegenScope, CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { ts, className, SKIP, Skip } from '@openapi-generator-plus/template-utils'
import { nestedModels } from './nestedModels'

export function modelNestedModels(generatorContext: CodegenGeneratorContext, schema: CodegenSchema): string | Skip {
	const scope = schema as CodegenSchema & CodegenScope
	if (!scope.schemas) {
		return SKIP
	}
	const name = className(generatorContext.generator(), (schema as { name: string }).name)
	return ts`

/**
 * @export
 * @namespace ${name}
 */
export namespace ${name} {
${nestedModels(generatorContext, scope)}
}`
}
