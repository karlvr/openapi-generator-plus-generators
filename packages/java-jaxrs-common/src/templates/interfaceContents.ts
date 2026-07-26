import { CodegenInterfaceSchema, CodegenProperty, isCodegenArraySchema, isCodegenObjectSchema } from '@openapi-generator-plus/types'
import * as idx from '@openapi-generator-plus/indexed-type'
import { className, identifier, isObject, isMap, isArray, capitalize, singular, Skip, SKIP } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from './types'
import { nestedModels } from './nestedModels'
import { propertyDocumentation } from './frag/propertyDocumentation'
import { propertyStatusAnnotations } from './frag/propertyStatusAnnotations'
import { pojoPropertyType } from './frag/pojoPropertyType'
import { getter, setter } from './helpers'

/** Drop SKIP entries while keeping literal blank-line separators, then join with newlines. */
function stackLines(lines: (string | Skip)[]): string {
	return lines.filter((line): line is string => line !== SKIP).join('\n')
}

/** The method declarations for a single property of an interface: chaining setter, optional get-or-create accessor, getter/setter and array convenience methods. */
function propertyDeclarations(property: CodegenProperty, interfaceName: string, ctx: JavaModelContext): string {
	const generator = ctx.generatorContext.generator()
	const name = identifier(generator, property.name)

	const lines: (string | Skip)[] = [
		propertyDocumentation(property),
		propertyStatusAnnotations(property),
		`${interfaceName} ${name}(${property.nativeType} ${name});`,
		'',
	]

	if (isObject(property) || isMap(property) || isArray(property)) {
		lines.push(
			'/**',
			` * Returns the ${name}, or if it's {@code null} it first creates a new object,`,
			' * sets the property to the new object, and then returns it.',
			' */',
			propertyStatusAnnotations(property),
			`${property.nativeType} ${name}();`,
			'',
		)
	}

	lines.push(
		propertyStatusAnnotations(property),
		`${pojoPropertyType(property)} ${getter(property, generator, ctx.root.useLombok)}();`,
		'',
		propertyStatusAnnotations(property),
		`void ${setter(property, generator, ctx.root.useLombok)}(${pojoPropertyType(property)} ${name});`,
	)

	if (isCodegenArraySchema(property.schema)) {
		const component = property.schema.component
		/* See the matching note in frag/pojoProperty.ts: the method name
		   singularizes the already-safe identifier, but the parameter
		   singularizes the raw property name and only then makes it identifier-safe. */
		const addName = `add${capitalize(singular(name))}`
		const paramName = identifier(generator, singular(property.name))
		lines.push(
			'',
			propertyStatusAnnotations(property),
			`${interfaceName} ${addName}(${component.nativeType} ${paramName});`,
		)
		if (isCodegenObjectSchema(component.schema)) {
			lines.push(
				'',
				propertyStatusAnnotations(property),
				`${component.nativeType} ${addName}();`,
			)
		}
	}

	lines.push('')
	return stackLines(lines) + '\n'
}

/**
 * The body of an interface declaration: its nested models, additional-
 * properties accessors (if the interface's implementation has additional
 * properties), and each property's chaining setter, accessors and
 * convenience methods.
 */
export function interfaceContents(schema: CodegenInterfaceSchema, ctx: JavaModelContext): string | Skip {
	const name = className(ctx.generatorContext.generator(), schema.name)
	const ap = schema.additionalProperties

	const nested = nestedModels(schema, ctx)
	const apBlock = ap ? `${ap.nativeType} getAdditionalProperties();

${ap.component.nativeType} getAdditionalProperty(java.lang.String name);

void put(java.lang.String name, ${ap.component.nativeType} value);

void setAdditionalProperties(${ap.nativeType} additionalProperties);

${ap.nativeType} additionalProperties();

${name} additionalProperties(${ap.nativeType} additionalProperties);

` : ''
	const propertiesBlock = schema.properties
		? idx.allValues(schema.properties).map(property => propertyDeclarations(property, name, ctx)).join('')
		: ''

	const result = (nested !== SKIP ? nested : '') + apBlock + propertiesBlock
	if (result === '') {
		return SKIP
	}

	/* This content is embedded at "\t${...}\n}" in the enclosing interface
	   declaration (see interface.ts/interfaceNested.ts), which itself supplies
	   the newline before that closing brace, so normalize to exactly one
	   trailing newline here. */
	return result.replace(/\n+$/, '\n')
}
