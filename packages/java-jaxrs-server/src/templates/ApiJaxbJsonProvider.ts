import { ts } from '@openapi-generator-plus/template-utils'
import { javax } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { ServerContext } from './types'

/**
 * A simple wrapper around Jackson's JSON provider that declares more specific
 * {@code @Produces} and {@code Consumes} so as to survive the provider sorting changes in
 * CXF 3.1.2 http://cxf.apache.org/docs/jax-rs.html#JAX-RS-CXF3.1.2ProviderSortingChanges
 */
export function apiJaxbJsonProvider(ctx: ServerContext): string {
	const apiProviderPackage = ctx.root.apiProviderPackage
	if (!apiProviderPackage) {
		throw new Error('apiJaxbJsonProvider requires apiProviderPackage to be set')
	}
	const jx = javax(ctx.root.useJakarta)

	return ts`
package ${apiProviderPackage};

/**
 * A simple wrapper around Jackson's JSON provider that declares more specific {@code @Produces} and {@code Consumes} so as to survive
 * the provider sorting changes in CXF 3.1.2 http://cxf.apache.org/docs/jax-rs.html#JAX-RS-CXF3.1.2ProviderSortingChanges
 */
@${jx}.ws.rs.Produces({"application/json; charset=UTF-8", "application/*+json; charset=UTF-8" })
@${jx}.ws.rs.Consumes({"application/json; charset=UTF-8", "application/*+json; charset=UTF-8" })
@${jx}.ws.rs.ext.Provider
${ctx.templates.jaxbJsonProviderAnnotations(ctx)}
public class ApiJaxbJsonProvider extends ${apiProviderPackage}.AbstractApiJaxbJsonProvider {

	public ApiJaxbJsonProvider() {
		super();
	}

}
`
}
