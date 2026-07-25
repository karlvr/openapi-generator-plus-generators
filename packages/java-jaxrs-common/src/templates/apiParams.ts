import { CodegenOperation, CodegenParameter, CodegenProperty } from '@openapi-generator-plus/types'
import * as idx from '@openapi-generator-plus/indexed-type'
import { ts, className, identifier, indent, when, SKIP, Skip } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from './types'
import { generatedAnnotation } from './generatedAnnotation'
import { customImplements } from './frag/customImplements'
import { propertyDocumentation } from './frag/propertyDocumentation'
import { pojoPropertyAnnotations } from './frag/pojoPropertyAnnotations'
import { pojoProperty } from './frag/pojoProperty'

/**
 * Adapts a parameter to the shape the model-property templates need, so an operation's
 * params class can reuse the same field-declaration and chaining-accessor rendering as a
 * model's own properties. Parameters have no discriminator/override/initial-value concept,
 * so those fill in with their "not applicable" values.
 */
function asProperty(parameter: CodegenParameter): CodegenProperty {
	return {
		...parameter,
		initialValue: null,
		discriminators: null,
		overrides: false,
	}
}

/** One field declaration for a params class, followed by a blank line. */
function paramField(parameter: CodegenParameter, ctx: JavaModelContext): string {
	const property = asProperty(parameter)
	return ts`
	${propertyDocumentation(property)}
	${pojoPropertyAnnotations(property, ctx)}
	private ${property.nativeType} ${identifier(ctx.generatorContext.generator(), property.name)};

`
}

/** The constructor taking the operation's path parameters, when it has any. Renders SKIP (dropping the line) otherwise. */
function pathParamsConstructor(pathParams: CodegenParameter[], name: string, ctx: JavaModelContext): string | Skip {
	if (pathParams.length === 0) {
		return SKIP
	}
	const generator = ctx.generatorContext.generator()
	const params = pathParams.map(p => `${p.nativeType} ${identifier(generator, p.name)}`).join(', ')
	const assignments = pathParams.map(p => `\t\tthis.${identifier(generator, p.name)} = ${identifier(generator, p.name)};`).join('\n')

	return ts`
	/**
	 * Create a new params object with its path parameters.
	 */
	public ${name}Params(${params}) {
${assignments}
	}

`
}

/**
 * The params class generated for an operation with multiple parameters (see
 * {@link CodegenOperation.useParamsClasses}): one field per parameter, a no-args
 * constructor, a path-parameters constructor when the operation has path parameters,
 * and chaining setters/getters for each parameter (as for a model property).
 */
export function apiParams(operation: CodegenOperation, ctx: JavaModelContext): string {
	const generator = ctx.generatorContext.generator()
	const name = className(generator, operation.uniqueName)
	const parameters = operation.parameters ? idx.allValues(operation.parameters) : []
	const pathParams = operation.pathParams ? idx.allValues(operation.pathParams) : []

	const apiParamsPackage = ctx.root.apiParamsPackage
	if (!apiParamsPackage) {
		throw new Error('apiParams requires apiParamsPackage to be set')
	}

	const customImplementsList = customImplements(`${apiParamsPackage}.${name}Params`, ctx.root)
	const implementsClause = customImplementsList !== SKIP ? ` implements ${customImplementsList}` : ''

	/*
	 * Each of these pieces ends in its own trailing blank line (matching a property's
	 * blank-line separation from whatever follows it), so they're assembled below via
	 * plain concatenation — not `ts` interpolation, which would double that blank line
	 * against the template's own line break before the next section.
	 */
	const fields = parameters.map(parameter => paramField(parameter, ctx)).join('')
	const noArgsConstructor = `\t/**\n\t * Create a new params object.\n\t */\n\tpublic ${name}Params() {\n\n\t}\n\n`
	const pathConstructor = pathParamsConstructor(pathParams, name, ctx)
	const pathConstructorText = pathConstructor !== SKIP ? pathConstructor : ''
	/* `pojoProperty` is written assuming a column-0 baseline (as it's normally embedded via
	   an outer blanket indent, e.g. the model's own `pojo.ts`); indented here explicitly
	   since a params class has no such wrapping step. */
	const properties = indent(parameters.map(parameter => pojoProperty(asProperty(parameter), `${name}Params`, ctx)).join(''), '\t')

	const body = (fields + noArgsConstructor + pathConstructorText + properties).replace(/\n+$/, '\n')

	return ts`
package ${apiParamsPackage};

${generatedAnnotation(ctx.root)}
${when(ctx.root.useLombok, () => ts`
@lombok.Getter
@lombok.Setter`)}
public class ${name}Params${implementsClause} {

${body}
}
`
}
