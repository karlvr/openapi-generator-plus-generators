import { RootContext } from '@openapi-generator-plus/java-jaxrs-generator-common'

/** The default list of JAX-RS providers a generated API implementation registers with its client. */
export function apiProviders(root: RootContext): string {
	return `providers.add(new MyJacksonJaxbJsonProvider());
providers.add(new ${root.apiProviderPackage ?? ''}.NoExplodeCollectionParamConverterProvider());`
}
