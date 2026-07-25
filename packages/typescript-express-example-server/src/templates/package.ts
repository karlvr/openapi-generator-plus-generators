import { ts, when } from '@openapi-generator-plus/template-utils'
import { NpmOptions, TemplateRootContext } from '@openapi-generator-plus/typescript-generator-common'

export function packageJson(ctx: TemplateRootContext & NpmOptions): string {
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
	"description": "API server for ${ctx.name}",
	"author": "@openapi-generator-plus/typescript-node-express-server-generator",
	"keywords": [
		"express",
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
		"start": "node dist/index"
	},
	"dependencies": {
		"express": "^4.18.2",
		"getopts": "^2.3.0"
	},
	"devDependencies": {
		"@types/node": "^20.14.8",
		"@types/express": "^4.17.17",
		"typescript": "^5.9.2"
	}${publishConfig}
}
`
}
