import { CodegenOperation, CodegenOperationGroup } from '@openapi-generator-plus/types'
import { ts, each, when, className, identifier, stringLiteral } from '@openapi-generator-plus/template-utils'
import { imports, operationVars, operationAnnotations, operationDocumentation, generatedAnnotation, javax } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { ServerContext } from './types'
import { bodyParam } from './frag/bodyParam'

/** One operation's JAX-RS interface method: its documentation, annotations, and abstract declaration. */
function operationMethod(operation: CodegenOperation, group: CodegenOperationGroup, ctx: ServerContext): string {
	const jx = javax(ctx.root.useJakarta)
	const { parameters } = operationVars(operation, { jaxrs: true, service: false }, bodyParam, ctx)

	return ts`
	${operationDocumentation(operation)}
	${operationAnnotations(operation, group.path, ctx)}
	${jx}.ws.rs.core.Response ${identifier(ctx.generatorContext.generator(), operation.name)}(${parameters});

`
}

/** The JAX-RS interface for one operation group: one abstract method per operation. */
export function api(group: CodegenOperationGroup, ctx: ServerContext): string {
	const jx = javax(ctx.root.useJakarta)
	const name = className(ctx.generatorContext.generator(), group.name)

	/* `each` methods, joined with no separator (each already ends in its own blank
	   line). Trimmed to exactly one trailing newline before the closing brace that
	   follows on the next template line, which supplies the separator itself. */
	const operations = each(group.operations, operation => operationMethod(operation, group, ctx), '')
	const operationsText = typeof operations === 'string' ? operations.replace(/\n+$/, '\n') : operations

	return ts`
package ${ctx.root.apiPackage};

${imports(ctx.root)}
${generatedAnnotation(ctx.root)}
@${jx}.ws.rs.Path("")
${when(group.consumes && group.consumes.length > 0, () => `@${jx}.ws.rs.Consumes({ ${each(group.consumes, c => `"${String(c)}"`, ', ')} })`)}
${when(group.produces && group.produces.length > 0, () => `@${jx}.ws.rs.Produces({ ${each(group.produces, c => `"${String(c)}"`, ', ')} })`)}
${each(group.tags, tag => `@io.swagger.v3.oas.annotations.tags.Tag(name = ${stringLiteral(ctx.generatorContext, tag)})`, '\n')}
public interface ${name}Api {

${operationsText}
}
`
}
