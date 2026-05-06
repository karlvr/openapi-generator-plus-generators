import { ts } from '@openapi-generator-plus/template-utils'
import { NpmOptions, TemplateRootContext } from '@openapi-generator-plus/typescript-generator-common'
import { FetchClient2Hooks, RootContext } from './types'

/**
 * Default body for the `packageDependencies` hook: a polyfill dependency
 * line if `includePolyfills` is set. Child generators that override this hook
 * typically replace it entirely with their own dependency list.
 */
function defaultPackageDependencies(ctx: RootContext): string[] {
	return ctx.includePolyfills ? ['"whatwg-fetch": "^3.6.2"'] : []
}

export function packageJson(ctx: TemplateRootContext & NpmOptions, hooks: FetchClient2Hooks): string {
	const root = ctx as TemplateRootContext & NpmOptions & RootContext
	const dependencies: string[] = []
	dependencies.push(...(hooks.packageDependencies ?? defaultPackageDependencies)(root))
	if (root.dateApproach === 'blind-date') {
		dependencies.push('"blind-date": "^3.2.0"')
	}
	const depsBlock = dependencies.join(',\n\t\t')

	return ts`{
	"name": "${ctx.name}",
${ctx.private ? '	"private": true,' : null}
	"version": "${ctx.version}",
	"description": "API client for ${ctx.name}",
	"author": "${(root as RootContext & { generatorClass?: string }).generatorClass ?? ''}",
	"keywords": [
		"fetch",
		"typescript",
		"swagger",
		"openapi",
		"${ctx.name}"
	],
	"license": "UNLICENSED",
	"main": "./dist/index.js",
	"typings": "./dist/index.d.ts",
	"scripts": {
		"build": "tsc",
		"prepare": "npm run build"
	},
	"dependencies": {
		${depsBlock}
	},
	"devDependencies": {
		"@types/node": "^20.14.8",
		"typescript": "^5.9.2"
${ctx.repository ? `	},
	"publishConfig": {
		"registry": "${ctx.repository}"` : null}
	}
}
`
}
