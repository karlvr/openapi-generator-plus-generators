import { CodegenLogLevel, CodegenParameter } from '@openapi-generator-plus/types'
import { join, when, stringLiteral, SKIP, Skip } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from '../types'
import { javax } from '../helpers'

/** The `@DefaultValue` annotation for a server-generated parameter with a default value, if any. */
function defaultValueAnnotation(parameter: CodegenParameter, ctx: JavaModelContext): string | Skip {
	if (!parameter.defaultValue || !ctx.root.serverGenerator) {
		return SKIP
	}

	const jx = javax(ctx.root.useJakarta)
	const value = parameter.defaultValue.value
	if (Array.isArray(value)) {
		/*
		 * A blank line before the annotation, matching a Handlebars quirk in the original
		 * template: the warning is logged via a plain (non-block) expression, which — unlike
		 * a block or partial — doesn't have its own line's whitespace stripped, so the
		 * line's trailing newline survives as a blank line even though `warn` itself
		 * renders nothing.
		 */
		const warning = value.length > 1 ? '\n' : ''
		if (warning) {
			ctx.generatorContext.log(CodegenLogLevel.WARN, `Array default value cannot be represented in parameter "${parameter.name}": ${value}`)
		}
		return `${warning}@${jx}.ws.rs.DefaultValue(${stringLiteral(ctx.generatorContext, value[0] as string | number | boolean | null)})`
	} else {
		return `@${jx}.ws.rs.DefaultValue(${stringLiteral(ctx.generatorContext, value as string | number | boolean | null)})`
	}
}

/** The parameter's own `@QueryParam`/`@PathParam`/`@HeaderParam`/`@FormParam`/`@CookieParam` annotation, according to its location. */
function locationAnnotation(parameter: CodegenParameter, ctx: JavaModelContext): string | Skip {
	const jx = javax(ctx.root.useJakarta)
	const serializedName = stringLiteral(ctx.generatorContext, parameter.serializedName)
	if (parameter.isQueryParam) {
		return `@${jx}.ws.rs.QueryParam(${serializedName})`
	} else if (parameter.isPathParam) {
		return `@${jx}.ws.rs.PathParam(${serializedName})`
	} else if (parameter.isHeaderParam) {
		return `@${jx}.ws.rs.HeaderParam(${serializedName})`
	} else if (parameter.isFormParam) {
		return `@${jx}.ws.rs.FormParam(${serializedName})`
	} else if (parameter.isCookieParam) {
		return `@${jx}.ws.rs.CookieParam(${serializedName})`
	} else {
		return SKIP
	}
}

/**
 * A JAX-RS method parameter's annotations: its Swagger `@Parameter` description, an
 * optional `@DefaultValue`, and its location annotation (`@QueryParam` and similar).
 * One annotation per line — the caller joins them onto the parameter's declaration.
 */
export function parameterAnnotations(parameter: CodegenParameter, ctx: JavaModelContext): string | Skip {
	const example = parameter.examples?.java
		? `example = ${parameter.examples.java.valueString}`
		: parameter.examples?.default
			? `example = ${parameter.examples.default.valueString}`
			: SKIP

	const props = join([
		`name = ${stringLiteral(ctx.generatorContext, parameter.serializedName)}`,
		when(parameter.description, () => `description = ${stringLiteral(ctx.generatorContext, parameter.description as string)}`),
		when(parameter.required, 'required = true'),
		when(parameter.deprecated, 'deprecated = true'),
		example,
	], ', ')

	return join([
		`@io.swagger.v3.oas.annotations.Parameter(${props})`,
		defaultValueAnnotation(parameter, ctx),
		locationAnnotation(parameter, ctx),
	], '\n')
}
