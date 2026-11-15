import { CodegenSchema, CodegenScope, CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { ts, className, SKIP, Skip } from '@openapi-generator-plus/template-utils'
import { nestedModels } from './nestedModels'

/**
 * Render the namespace of the schemas nested in a schema.
 * @param path the names of the namespaces that enclose the schema, from the API namespace
 */
export function modelNestedModels(generatorContext: CodegenGeneratorContext, schema: CodegenSchema, path: string[]): string | Skip {
	const scope = schema as CodegenSchema & CodegenScope
	if (!scope.schemas) {
		return SKIP
	}
	const name = className(generatorContext.generator(), (schema as { name: string }).name)
	/* The first line of the template is the margin; the second, blank, line
	 * separates the namespace from its owning model. */
	return ts`

/**
 * @export
 * @namespace ${name}
 */
export namespace ${name} {
${nestedModels(generatorContext, scope, [...path, name])}
}`
}
