import { ts } from '@openapi-generator-plus/template-utils'

export function gitignore(): string {
	return ts`/node_modules
`
}
