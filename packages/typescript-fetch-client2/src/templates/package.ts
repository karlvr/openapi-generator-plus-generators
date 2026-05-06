import { ts, join, when, Skip } from '@openapi-generator-plus/template-utils'
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
	const dependencies: (string | Skip)[] = [
		...(hooks.packageDependencies ?? defaultPackageDependencies)(root),
		when(root.dateApproach === 'blind-date', '"blind-date": "^3.2.0"'),
	]

	/* `publishConfig` is appended after the closing `}` of `devDependencies`,
	 * so it can't be on its own line — we precompute either the trailing block
	 * or an empty string and interpolate that mid-line. */
	const publishConfig = ctx.repository ? ts`,
	"publishConfig": {
		"registry": "${ctx.repository}"
	}` : ''

	return ts`
{
	"name": "${ctx.name}",
	${when(ctx.private, '"private": true,')}
	"version": "${ctx.version}",
	"description": "API client for ${ctx.name}",
	"author": "${root.generatorClass}",
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
		${join(dependencies, ',\n')}
	},
	"devDependencies": {
		"@types/node": "^20.14.8",
		"typescript": "^5.9.2"
	}${publishConfig}
}
`
}
