import { ts, SKIP } from '@openapi-generator-plus/template-utils'
import { header } from './header'
import { nestedModels } from './nestedModels'
import { DocumentContext, FetchClient2Hooks, RootContext } from './types'
import { CodegenGeneratorContext } from '@openapi-generator-plus/types'

export function models(generatorContext: CodegenGeneratorContext, ctx: DocumentContext, hooks: FetchClient2Hooks): string {
	const dateApproachImport = ctx.dateApproach === 'blind-date'
		? `\nimport { LocalDateString, LocalTimeString, LocalDateTimeString, OffsetDateTimeString } from 'blind-date'`
		: ''
	const modelsImports = hooks.modelsImports?.(ctx as RootContext) ?? ''

	return ts`${header(ctx)}${dateApproachImport}
${modelsImports || SKIP}

type ValuesOf<T> = T[keyof T]

export namespace Api {
${nestedModels(generatorContext, { schemas: ctx.schemas })}
}
`
}
