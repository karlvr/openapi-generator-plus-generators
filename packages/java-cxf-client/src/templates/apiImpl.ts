import { CodegenOperationGroup } from '@openapi-generator-plus/types'
import { ts, className, indentTail } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { ClientRootContext } from '@openapi-generator-plus/java-jaxrs-client-generator'
import { securityFields, securityImplBody } from './securityScheme'

/**
 * This client's class-level documentation, describing the generated API implementation's
 * thread-safety. Ends with no trailing newline after the doc comment's closing delimiter:
 * `apiImpl.ts` (in `java-jaxrs-client`) appends its own single newline after this hook's
 * output, so ending this in a newline too would double it up into a blank line.
 */
export function apiImplHeader(): string {
	return ts`
/**
 * An implementation of the API invoker interface. The underlying API client is stateful so
 * instances of this class should not be shared across threads.
 */`
}

/**
 * This client's extra `apiImpl` members: the underlying CXF client, one instance field per
 * configured security scheme, the constructors that build the client from a base address (or
 * an already-constructed `ApiSpec`/`Client` pair), and the security schemes' `authorize*`
 * methods plus the CXF client's own accessors.
 */
export function apiImplClassBody(group: CodegenOperationGroup, ctx: JavaModelContext): string {
	const generator = ctx.generatorContext.generator()
	const root = ctx.root as ClientRootContext
	const name = className(generator, group.name)

	const fields = securityFields(ctx)
	const authMethods = securityImplBody(ctx)
	const authMethodsText = typeof authMethods === 'string' ? authMethods : ''

	const body = ts`
private org.apache.cxf.jaxrs.client.Client client;

${fields}

public ${name}ApiImpl() {
	this(${root.apiPackage}.ApiConstants.DEFAULT_SERVER, ${root.apiPackage}.ApiProviders.defaultProviders());
}

public ${name}ApiImpl(java.lang.String baseAddress) {
	this(baseAddress, ${root.apiPackage}.ApiProviders.defaultProviders());
}

public ${name}ApiImpl(java.lang.String baseAddress, java.util.List<?> providers) {
	this(org.apache.cxf.jaxrs.client.JAXRSClientFactory.create(baseAddress, ${root.apiSpecPackage}.${name}ApiSpec.class, providers));
}

public ${name}ApiImpl(${root.apiSpecPackage}.${name}ApiSpec api) {
	this(api, org.apache.cxf.jaxrs.client.WebClient.client(api));
}

public ${name}ApiImpl(${root.apiSpecPackage}.${name}ApiSpec api, org.apache.cxf.jaxrs.client.Client client) {
	this.api = api;
	this.client = client;

	setConnectionTimeout(${root.apiPackage}.ApiConstants.DEFAULT_CONNECTION_TIMEOUT_MILLIS);
	setReceiveTimeout(${root.apiPackage}.ApiConstants.DEFAULT_RECEIVE_TIMEOUT_MILLIS);
}

${authMethodsText}@java.lang.Override
public org.apache.cxf.jaxrs.client.Client client() {
	return client;
}

@java.lang.Override
public long getConnectionTimeout() {
	return org.apache.cxf.jaxrs.client.WebClient.getConfig(client).getHttpConduit().getClient().getConnectionTimeout();
}

public void setConnectionTimeout(long connectionTimeout) {
	org.apache.cxf.jaxrs.client.WebClient.getConfig(client).getHttpConduit().getClient().setConnectionTimeout(connectionTimeout);
}

@java.lang.Override
public long getReceiveTimeout() {
	return org.apache.cxf.jaxrs.client.WebClient.getConfig(client).getHttpConduit().getClient().getReceiveTimeout();
}

public void setReceiveTimeout(long receiveTimeout) {
	org.apache.cxf.jaxrs.client.WebClient.getConfig(client).getHttpConduit().getClient().setReceiveTimeout(receiveTimeout);
}
`

	/*
	 * `apiImpl.ts` (java-jaxrs-client) splices this hook's output via a plain
	 * (non-`ts`-tagged) template literal at one tab of indentation, so every line here must
	 * carry its own indent rather than relying on `ts`'s alone-on-line auto-indent.
	 */
	return indentTail(body, '\t')
}
