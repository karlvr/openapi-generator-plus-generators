import { ts } from '@openapi-generator-plus/template-utils'
import { generatedAnnotation, javax } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { ClientRootContext } from './types'

/** Thrown when the server returns a status code the API doesn't document. */
export function unexpectedResponseException(root: ClientRootContext): string {
	const jx = javax(root.useJakarta)

	return ts`
package ${root.apiPackage};

/**
 * The server returned a status code that is not documented in the API.
 */
${generatedAnnotation(root)}
public class UnexpectedResponseException extends ${root.apiPackage}.UnexpectedApiException {

	private static final long serialVersionUID = 1L;

	private ${jx}.ws.rs.core.Response response;
	private ${jx}.ws.rs.WebApplicationException webApplicationException;

	public UnexpectedResponseException(${jx}.ws.rs.core.Response response, ${jx}.ws.rs.WebApplicationException exception) {
		super("Unexpected response status " + response.getStatus());
		this.response = response;
		this.webApplicationException = exception;
	}

	public ${jx}.ws.rs.core.Response getResponse() {
		return response;
	}

	public ${jx}.ws.rs.WebApplicationException getWebApplicationException() {
		return webApplicationException;
	}

	public int getStatus() {
		return response.getStatus();
	}

}
`
}
