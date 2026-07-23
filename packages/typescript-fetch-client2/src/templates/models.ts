import { ts, maybe } from '@openapi-generator-plus/template-utils'
import { header } from './header'
import { nestedModels } from './nestedModels'
import { DocumentContext, FetchClient2Hooks, RootContext } from './types'
import { CodegenGeneratorContext } from '@openapi-generator-plus/types'

export function models(generatorContext: CodegenGeneratorContext, ctx: DocumentContext, hooks: FetchClient2Hooks): string {
	return ts`${header(ctx)}${ctx.dateApproach === 'blind-date'
		? `\n\nimport { LocalDateString, LocalTimeString, LocalDateTimeString, OffsetDateTimeString } from 'blind-date'`
		: ''}
${maybe(hooks.modelsImports?.(ctx as RootContext))}

type ValuesOf<T> = T[keyof T]

export namespace ${ctx.apiNamespace} {
${nestedModels(generatorContext, { schemas: ctx.schemas })}
}

`
}
