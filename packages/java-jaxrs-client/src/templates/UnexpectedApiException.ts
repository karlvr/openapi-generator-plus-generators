import { ts } from '@openapi-generator-plus/template-utils'
import { generatedAnnotation } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { ClientRootContext } from './types'

/**
 * The abstract base of every exception the generated API client throws for an
 * unexpected outcome (as opposed to a documented non-default response).
 */
export function unexpectedApiException(root: ClientRootContext): string {
	const superclass = root.useRuntimeUnexpectedExceptions ? 'RuntimeException' : 'Exception'

	return ts`
package ${root.apiPackage};

/**
 * Something unexpected occured while making an API request.
 *
 * Note that API exceptions do not use any JAX-RS exceptions as causes
 * as that can trigger a JAX-RS-aware server to use the responses in those
 * exceptions as the server's response.
 */
${generatedAnnotation(root)}
public abstract class UnexpectedApiException extends java.lang.${superclass} {

	private static final long serialVersionUID = 1L;

	protected UnexpectedApiException(java.lang.String message) {
		super(message);
	}

}
`
}
