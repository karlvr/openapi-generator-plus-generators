import { CodegenOperation, CodegenSecurityRequirements, CodegenAuthScope, CodegenContent } from '@openapi-generator-plus/types'
import { ts, each, join, when, maybe, stringLiteral, isObject, SKIP, Skip } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from '../types'
import { javax } from '../helpers'

/** The extra security-related annotations injected before an operation's own annotations, when security is required (not optional). */
function securityAnnotations(securityRequirements: CodegenSecurityRequirements | null, ctx: JavaModelContext): string | Skip {
	if (!securityRequirements || securityRequirements.optional) {
		return SKIP
	}

	const authenticationRequiredAnnotation = ctx.root.authenticationRequiredAnnotation
	const lines: (string | Skip)[] = [
		typeof authenticationRequiredAnnotation === 'string' && authenticationRequiredAnnotation ? authenticationRequiredAnnotation : SKIP,
	]
	for (const requirement of securityRequirements.requirements) {
		for (const scheme of requirement.schemes) {
			const annotation = scheme.scheme.vendorExtensions?.['x-java-operation-annotation']
			lines.push(annotation !== undefined ? String(annotation) : SKIP)
		}
	}
	return join(lines, '\n')
}

/** One `@SecurityRequirement` annotation entry, for the `security` array of the `@Operation` annotation. */
function securityRequirementAnnotation(schemeName: string, scopes: CodegenAuthScope[] | null, ctx: JavaModelContext): string {
	const scopesProp = scopes && scopes.length > 0
		? `, scopes = { ${each(scopes, scope => stringLiteral(ctx.generatorContext, scope.name), ', ')} }`
		: ''
	return `\t\t@io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "${schemeName}"${scopesProp}),`
}

/** The `security = { ... }` entry of the `@Operation` annotation, when the operation declares security requirements. */
function securityEntry(securityRequirements: CodegenSecurityRequirements | null, ctx: JavaModelContext): string | Skip {
	if (!securityRequirements) {
		return SKIP
	}

	const entries: (string | Skip)[] = []
	for (const requirement of securityRequirements.requirements) {
		for (const scheme of requirement.schemes) {
			entries.push(securityRequirementAnnotation(scheme.scheme.name, scheme.scopes, ctx))
		}
	}
	entries.push(when(securityRequirements.optional, '\t\t@io.swagger.v3.oas.annotations.security.SecurityRequirement(name = ""), /* Security is declared as optional */'))

	return `,\n\tsecurity = {\n${join(entries, '\n')}\n\t}`
}

/** One `@Content` entry for a response's `content = { ... }` array. */
function contentAnnotation(content: CodegenContent, ctx: JavaModelContext): string {
	const schemaProp = content.schema
		? `, schema = @io.swagger.v3.oas.annotations.media.Schema(${isObject(content.schema) ? `implementation = ${content.nativeType}.class` : ''})`
		: ''
	return `\t\t\t\t@io.swagger.v3.oas.annotations.media.Content(mediaType = ${stringLiteral(ctx.generatorContext, content.mediaType.mediaType)}${schemaProp}),`
}

/** The `responses = { ... }` entry of the `@Operation` annotation: one `@ApiResponse` per response. */
function apiResponseAnnotation(operation: CodegenOperation, ctx: JavaModelContext): string | Skip {
	return each(operation.responses, response => {
		const contentBlock = response.contents && response.contents.length > 0
			? `,\n\t\t\tcontent = {\n${each(response.contents, content => contentAnnotation(content, ctx), '\n')}\n\t\t\t}`
			: ''
		return `\t\t@io.swagger.v3.oas.annotations.responses.ApiResponse(\n\t\t\tresponseCode = "${String(response.code)}",\n\t\t\tdescription = ${stringLiteral(ctx.generatorContext, response.description)}${contentBlock}\n\t\t),`
	}, '\n')
}

/**
 * A JAX-RS operation method's annotations: the HTTP method, the `apiMethodAnnotations`
 * hook, extra security annotations, `@Deprecated`, `@Path`, `@Consumes`/`@Produces`, and
 * the Swagger `@Operation` annotation describing responses, security and tags.
 */
export function operationAnnotations(operation: CodegenOperation, groupPath: string, ctx: JavaModelContext): string {
	const jx = javax(ctx.root.useJakarta)

	const summaryPart = `summary = ${operation.summary ? stringLiteral(ctx.generatorContext, operation.summary) : '""'}`
	const descriptionPart = operation.description ? `,\n\tdescription = ${stringLiteral(ctx.generatorContext, operation.description)}` : ''

	return ts`
@${jx}.ws.rs.${operation.httpMethod}
${ctx.templates.apiMethodAnnotations(operation, ctx)}
${securityAnnotations(operation.securityRequirements, ctx)}
${when(operation.deprecated, '@java.lang.Deprecated')}
${when(groupPath || operation.path, () => `@${jx}.ws.rs.Path("${groupPath}${operation.path}")`)}
${when(operation.consumes && operation.consumes.length > 0, () => `@${jx}.ws.rs.Consumes({ ${each(operation.consumes, c => `"${c.mediaType}"`, ', ')} })`)}
${when(operation.produces && operation.produces.length > 0, () => `@${jx}.ws.rs.Produces({ ${each(operation.produces, p => `"${p.mediaType}"`, ', ')} })`)}
@io.swagger.v3.oas.annotations.Operation(
	${maybe(operation.operationId, id => `operationId = ${stringLiteral(ctx.generatorContext, id)},`)}
	${summaryPart}${descriptionPart},
	responses = {
${apiResponseAnnotation(operation, ctx)}
	}${securityEntry(operation.securityRequirements, ctx)},
	tags = { ${each(operation.tags, tag => stringLiteral(ctx.generatorContext, tag), ', ')} }
)`
}
