import { ts, each } from '@openapi-generator-plus/template-utils'
import { TypeScriptOptions, TemplateRootContext } from '@openapi-generator-plus/typescript-generator-common'

export function tsconfig(ctx: TemplateRootContext & TypeScriptOptions): string {
	const libsBlock = each(ctx.libs, (lib, _i, _f, isLast) => `\t\t\t"${lib}"${isLast ? '' : ','}`, '\n')
	return ts`{
	"compilerOptions": {
		"declaration": true,
		"target": "${ctx.target}",
		"module": "commonjs",
		"noImplicitAny": true,
		"esModuleInterop": true,
		"allowSyntheticDefaultImports": true,
		"outDir": "dist",
		"lib": [
${libsBlock}
		]
	},
	"include": [
		"./${ctx.relativeSourceOutputPath}"
	]
}
`
}
