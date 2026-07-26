import { ts, each, maybe, when, className } from '@openapi-generator-plus/template-utils'
import { CodegenGeneratorContext, CodegenNamedSchema, isCodegenEnumSchema } from '@openapi-generator-plus/types'
import * as idx from '@openapi-generator-plus/indexed-type'
import { header } from './header'
import { nestedModels } from './nestedModels'
import { schemaDocumentation } from './frag/schemaDocumentation'
import { DateApproach } from '@openapi-generator-plus/typescript-generator-common'
import { DocumentContext, FetchClientHooks } from './types'

/**
 * Render the top-level `export type X = Api.X` (or `export import` for enums)
 * re-export that lets consumers use a legacy, unnamespaced import for a
 * top-level model. Renders the schema's own doc comment followed by the
 * re-export statement.
 */
function legacyUnnamespacedExport(generatorContext: CodegenGeneratorContext, apiNamespace: string, schema: CodegenNamedSchema): string {
	const gen = generatorContext.generator()
	const name = className(gen, schema.name)
	const stmt = isCodegenEnumSchema(schema)
		? `export import ${name} = ${apiNamespace}.${name}`
		: `export type ${name} = ${apiNamespace}.${name}`
	return ts`
${maybe(schemaDocumentation(schema))}
${stmt}
`
}

export function models(generatorContext: CodegenGeneratorContext, ctx: DocumentContext, hooks: FetchClientHooks): string {
	return ts`
${header(ctx)}${ctx.dateApproach === DateApproach.BlindDate
		? '\n\nimport { LocalDateString, LocalTimeString, LocalDateTimeString, OffsetDateTimeString } from \'blind-date\';'
		: ''}
${maybe(hooks.modelsImports?.(ctx))}

export namespace ${ctx.apiNamespace} {
${nestedModels(generatorContext, { schemas: ctx.schemas })}
}
${when(ctx.legacyUnnamespacedModelSupport, () => ts`

${each(idx.allValues(ctx.schemas), (schema) => legacyUnnamespacedExport(generatorContext, ctx.apiNamespace, schema), '\n')}`)}
`
}
