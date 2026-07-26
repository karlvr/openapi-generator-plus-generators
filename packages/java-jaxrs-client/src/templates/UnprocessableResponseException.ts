import { ts } from '@openapi-generator-plus/template-utils'
import { generatedAnnotation, javax } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { ClientRootContext } from './types'

/** Thrown when the server's response can't be processed (e.g. it isn't valid for its declared media type). */
export function unprocessableResponseException(root: ClientRootContext): string {
	const jx = javax(root.useJakarta)

	return ts`
package ${root.apiPackage};

/**
 * The server returned a response that couldn't be processed.
 */
${generatedAnnotation(root)}
public class UnprocessableResponseException extends ${root.apiPackage}.UnexpectedApiException {

	private static final long serialVersionUID = 1L;

	private ${jx}.ws.rs.core.Response response;
	private ${jx}.ws.rs.ProcessingException processingException;

	public UnprocessableResponseException(${jx}.ws.rs.core.Response response, ${jx}.ws.rs.ProcessingException exception) {
		super("Response processing failed for response status " + response.getStatus() + ": " + exception.getMessage() +
			(exception.getCause() != null ? ": " + exception.getCause() : ""));
		this.response = response;
		this.processingException = exception;
	}

	public ${jx}.ws.rs.core.Response getResponse() {
		return response;
	}

	public ${jx}.ws.rs.ProcessingException getProcessingException() {
		return processingException;
	}

}
`
}
