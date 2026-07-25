import { ts } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { securityInvokerBody } from './securityScheme'

/**
 * This client's extra `ApiInvoker` members: one `authorize*`/`get*Authorization` method pair
 * per configured security scheme (see `securityScheme.ts`), the underlying CXF client
 * accessor, and the connect/receive timeout accessors every generated API implementation
 * exposes.
 */
export function apiInvokerInterfaceBody(ctx: JavaModelContext): string {
	const securityMethods = securityInvokerBody(ctx)
	const securityMethodsText = typeof securityMethods === 'string' ? securityMethods : ''

	return ts`
${securityMethodsText}org.apache.cxf.jaxrs.client.Client client();

/**
 * Returns the timeout on API requests in milliseconds.
 */
long getReceiveTimeout();

/**
 * Set the timeout on API requests in milliseconds.
 */
void setReceiveTimeout(long receiveTimeout);

/**
 * Returns the timeout on connections to the API in milliseconds.
 */
long getConnectionTimeout();

/**
 * Set the timeout on connections to the API in milliseconds.
 */
void setConnectionTimeout(long connectionTimeout);
`
}
