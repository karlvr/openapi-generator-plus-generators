import { ts } from '@openapi-generator-plus/template-utils'
import { licenseInfo } from './licenseInfo'
import { DocumentContext } from './types'

export function header(ctx: DocumentContext): string {
	return ts`/* eslint-disable */
// tslint:disable
${licenseInfo(ctx)}
`
}
