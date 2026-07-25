import { ts } from '@openapi-generator-plus/template-utils'
import { generatedAnnotation, javax } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { ClientRootContext } from './types'

/** Thrown when the underlying JAX-RS client fails to process a request or response for a reason other than a timeout. */
export function unexpectedApiProcessingException(root: ClientRootContext): string {
	const jx = javax(root.useJakarta)

	return ts`
package ${root.apiPackage};

/**
 * An unexpected exception occurred during API processing.
 */
${generatedAnnotation(root)}
public class UnexpectedApiProcessingException extends ${root.apiPackage}.UnexpectedApiException {

	private static final long serialVersionUID = 1L;

	public UnexpectedApiProcessingException(${jx}.ws.rs.ProcessingException exception) {
		super(
			exception.getMessage() != null
				? exception.getMessage()
				: exception.getCause() != null && exception.getCause().getMessage() != null
					? exception.getCause().getMessage()
					: exception.toString()
		);
	}

}
`
}
