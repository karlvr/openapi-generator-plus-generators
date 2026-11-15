import { CodegenSchemas, CodegenGeneratorContext, CodegenScope, isCodegenEnumSchema, isCodegenObjectSchema, isCodegenOneOfSchema, isCodegenAnyOfSchema, isCodegenInterfaceSchema } from '@openapi-generator-plus/types'
import { className, each, indent, SKIP, Skip } from '@openapi-generator-plus/template-utils'
import * as idx from '@openapi-generator-plus/indexed-type'
import { modelEnum, modelEnumValues } from './modelEnum'
import { modelGeneric } from './modelGeneric'
import { modelInterface } from './modelInterface'
import { modelOneOf } from './modelOneOf'

/**
 * Render the types of the schemas in a scope.
 * @param path the names of the enclosing namespaces, from the API namespace, which is also the path
 * of the object of enum values for the scope
 */
export function nestedModels(generatorContext: CodegenGeneratorContext, scope: { schemas: CodegenSchemas | null }, path: string[]): string | Skip {
	if (!scope.schemas) {
		return SKIP
	}
	const schemas = idx.allValues(scope.schemas)
	return each(schemas, (schema) => {
		let body: string
		if (isCodegenEnumSchema(schema)) {
			body = modelEnum(generatorContext, schema, path)
		} else if (isCodegenObjectSchema(schema)) {
			body = modelGeneric(generatorContext, schema, path)
		} else if (isCodegenOneOfSchema(schema) || isCodegenAnyOfSchema(schema)) {
			body = modelOneOf(generatorContext, schema, path)
		} else if (isCodegenInterfaceSchema(schema)) {
			body = modelInterface(generatorContext, schema, path)
		} else {
			return SKIP
		}
		/* Indent every nested model so it sits inside its enclosing namespace, with a
		 * separating blank line after each. */
		return `${indent(body, '\t')}\n`
	}, '\n')
}

/**
 * Render the properties of the object of enum values for a scope: the values of each enum in the
 * scope, and an object for each schema whose nested schemas include an enum. Returns SKIP when the
 * scope does not have an enum.
 */
export function nestedEnumValues(generatorContext: CodegenGeneratorContext, scope: { schemas: CodegenSchemas | null }): string | Skip {
	if (!scope.schemas) {
		return SKIP
	}
	const properties: string[] = []
	for (const schema of idx.allValues(scope.schemas)) {
		if (isCodegenEnumSchema(schema)) {
			properties.push(modelEnumValues(generatorContext, schema))
			continue
		}
		const nested = (schema as Partial<CodegenScope>).schemas
		const values = nested ? nestedEnumValues(generatorContext, { schemas: nested }) : SKIP
		if (values !== SKIP) {
			const name = className(generatorContext.generator(), (schema as { name: string }).name)
			properties.push(`${name}: {\n${values}\n},`)
		}
	}
	return properties.length > 0 ? indent(properties.join('\n'), '\t') : SKIP
}
