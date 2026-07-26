import { ts } from '@openapi-generator-plus/template-utils'
import { javax } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { ServerContext } from './types'

/** The generated (empty-bodied) JAX-RS `Application`, ready for customisation. */
export function invokerImpl(basePath: string, ctx: ServerContext): string {
	const jx = javax(ctx.root.useJakarta)
	const invokerName = ctx.root.invokerName
	const invokerPackage = ctx.root.invokerPackage
	if (!invokerName) {
		throw new Error('invokerImpl requires invokerName to be set')
	}
	if (!invokerPackage) {
		throw new Error('invokerImpl requires invokerPackage to be set')
	}

	return ts`
package ${invokerPackage};

/**
 * This is the JAX-RS application that initializes the API, including adding providers and API endpoints.
 */
${ctx.templates.invokerClassAnnotations(ctx)}
@${jx}.ws.rs.ApplicationPath("${basePath}")
public class ${invokerName} extends ${invokerPackage}.Abstract${invokerName} {

}
`
}
