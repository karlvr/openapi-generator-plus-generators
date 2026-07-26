import { ts } from '@openapi-generator-plus/template-utils'
import { javax } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { ClientRootContext } from '../types'

/** Provides authorization to API calls, and reauthorizes after a failed (401) request. */
export function apiAuthorizationProvider(root: ClientRootContext): string {
	const jx = javax(root.useJakarta)

	return ts`
package ${root.apiSpiPackage};

/**
 * Provide authorization to API calls.
 */
public interface ApiAuthorizationProvider {

	/**
	 * Provide authorization for the given invoker.
	 */
	void authorize(${root.apiPackage}.ApiInvoker api);

	/**
	 * Handle failed authorization for the given invoker, represented
	 * by the given failed response.
	 * @return {@code true} if reauthorization succeeded, or {@code false} if it didn't.
	 */
	boolean reauthorize(${root.apiPackage}.ApiInvoker api, ${jx}.ws.rs.core.Response response);

}
`
}
