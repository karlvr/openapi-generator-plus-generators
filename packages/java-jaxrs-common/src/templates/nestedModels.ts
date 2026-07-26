import { CodegenScope, isCodegenEnumSchema, isCodegenInterfaceSchema, isCodegenObjectSchema, isCodegenWrapperSchema } from '@openapi-generator-plus/types'
import * as idx from '@openapi-generator-plus/indexed-type'
import { SKIP, Skip } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from './types'
import { enumNested } from './enumNested'
import { interfaceNested } from './interfaceNested'
import { pojoNested } from './pojoNested'
import { wrapperNested } from './wrapperNested'

/**
 * The nested model classes declared within a scope (an object, interface or
 * wrapper schema's own `schemas`), each followed by a blank line. Renders
 * SKIP (dropping the whole line) when the scope has no nested schemas.
 */
export function nestedModels(scope: CodegenScope, ctx: JavaModelContext): string | Skip {
	if (!scope.schemas) {
		return SKIP
	}
	const schemas = idx.allValues(scope.schemas)
	if (schemas.length === 0) {
		return SKIP
	}
	return schemas.map(schema => {
		if (isCodegenEnumSchema(schema)) {
			return enumNested(schema, ctx) + '\n'
		} else if (isCodegenInterfaceSchema(schema)) {
			return interfaceNested(schema, ctx) + '\n'
		} else if (isCodegenObjectSchema(schema)) {
			return pojoNested(schema, ctx) + '\n'
		} else if (isCodegenWrapperSchema(schema)) {
			return wrapperNested(schema, ctx) + '\n'
		} else {
			return ''
		}
	}).join('')
}
