import { ts, maybe } from '@openapi-generator-plus/template-utils'
import { header } from './header'
import { nestedEnumValues, nestedModels } from './nestedModels'
import { DocumentContext, FetchClient2Hooks, RootContext } from './types'
import { CodegenGeneratorContext } from '@openapi-generator-plus/types'

/**
 * Render `models.ts`. The API namespace holds only types, so that the output is erasable syntax.
 * A constant of the same name holds the values of the enums, in the same nesting as their types,
 * so that `Api.Status` names both the type of an enum and the object of its values.
 */
export function models(generatorContext: CodegenGeneratorContext, ctx: DocumentContext, hooks: FetchClient2Hooks): string {
	return ts`
${header(ctx)}${ctx.dateApproach === 'blind-date'
	? '\n\nimport type { LocalDateString, LocalTimeString, LocalDateTimeString, OffsetDateTimeString } from \'blind-date\''
	: ''}
${maybe(hooks.modelsImports?.(ctx as RootContext))}

type ValuesOf<T> = T[keyof T]

export namespace ${ctx.apiNamespace} {
${nestedModels(generatorContext, { schemas: ctx.schemas }, [ctx.apiNamespace])}
}

/**
 * The values of the enums in the {@link ${ctx.apiNamespace}} namespace.
 */
export const ${ctx.apiNamespace} = {
${nestedEnumValues(generatorContext, { schemas: ctx.schemas })}
} as const;

`
}
