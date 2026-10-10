import { CodegenOperation, CodegenOperationGroup } from '@openapi-generator-plus/types'
import { ts, each, when, className, identifier } from '@openapi-generator-plus/template-utils'
import { imports, operationVars, operationAnnotations, generatedAnnotation, javax } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { ClientContext } from './types'
import { bodyParam } from './frag/bodyParam'

/**
 * One operation's low-level JAX-RS interface method: its Swagger/JAX-RS annotations and
 * abstract declaration.
 *
 * Every method returns a JAX-RS `Response`, and declares no exception. A JAX-RS client then
 * hands back every status code, rather than deserialising one of them and throwing for the
 * rest. The generated implementation reads the status itself, so it reaches a response that
 * the API documents with a 2xx code, and the headers of every response.
 */
function operationMethod(operation: CodegenOperation, group: CodegenOperationGroup, ctx: ClientContext): string {
	const { parameters } = operationVars(operation, { jaxrs: true, service: false }, bodyParam, ctx)
	const returnType = `${javax(ctx.root.useJakarta)}.ws.rs.core.Response`

	return ts`
	${operationAnnotations(operation, group.path, ctx)}
	${returnType} ${identifier(ctx.generatorContext.generator(), operation.name)}(${parameters});

`
}

/**
 * The low-level JAX-RS API client interface (`ApiSpec`) the generated `ApiImpl` invokes via
 * CXF's `JAXRSClientFactory`/`WebClient`. Unlike the high-level `Api` interface, this carries
 * the JAX-RS/Swagger annotations that describe the wire format.
 */
export function apiSpec(group: CodegenOperationGroup, ctx: ClientContext): string {
	const jx = javax(ctx.root.useJakarta)
	const name = className(ctx.generatorContext.generator(), group.name)

	const operations = each(group.operations, operation => operationMethod(operation, group, ctx), '')
	const operationsText = typeof operations === 'string' ? operations.replace(/\n+$/, '\n') : operations

	return ts`
package ${ctx.root.apiSpecPackage};

${imports(ctx.root)}
/**
 * The JAX-RS API client interface.
 *
 */
${generatedAnnotation(ctx.root)}
${when(group.consumes && group.consumes.length > 0, () => `@${jx}.ws.rs.Consumes({ ${each(group.consumes, c => `"${c.mediaType}"`, ', ')} })`)}
${when(group.produces && group.produces.length > 0, () => `@${jx}.ws.rs.Produces({ ${each(group.produces, p => `"${p.mediaType}"`, ', ')} })`)}
public interface ${name}ApiSpec {

${operationsText}
}
`
}
