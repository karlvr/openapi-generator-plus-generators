import { ts } from '@openapi-generator-plus/template-utils'
import { generatedAnnotation } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { ClientContext } from './types'

/**
 * The generated `ApiInvoker` base interface every generated API interface extends: the
 * `apiInvokerInterfaceBody` extension point (e.g. a CXF-based client's security-scheme
 * authorization methods and timeout accessors) plus the authorization-provider accessors
 * every client implementation needs.
 */
export function apiInvoker(ctx: ClientContext): string {
	const root = ctx.root

	return ts`
package ${root.apiPackage};

${generatedAnnotation(root)}
public interface ApiInvoker {

	${ctx.templates.apiInvokerInterfaceBody(ctx)}
	${root.apiSpiPackage}.ApiAuthorizationProvider getAuthorizationProvider();
	void setAuthorizationProvider(${root.apiSpiPackage}.ApiAuthorizationProvider authorizationProvider);

}
`
}
