import { ts } from '@openapi-generator-plus/template-utils'
import { generatedAnnotation } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { ClientRootContext } from './types'

/** Thrown when connecting to, or receiving a response from, the API times out. */
export function unexpectedTimeoutException(root: ClientRootContext): string {
	return ts`
package ${root.apiPackage};

/**
 * A timeout was encountered when connecting to or receiving a response from the API.
 */
${generatedAnnotation(root)}
public class UnexpectedTimeoutException extends ${root.apiPackage}.UnexpectedApiException {

	private static final long serialVersionUID = 1L;

	public UnexpectedTimeoutException(java.net.SocketTimeoutException e) {
		super("Unexpected timeout: " + e.getMessage());
	}

}
`
}
