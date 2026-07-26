import { ts } from '@openapi-generator-plus/template-utils'
import { generatedAnnotation, RootContext } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { apiProviders } from './frag/apiProviders'
import { apiProvidersJsonProvider } from './frag/apiProvidersJsonProvider'

/**
 * The generated `ApiProviders` interface: the default list of JAX-RS providers a generated API
 * implementation registers with its client, and the Jackson JAX-RS JSON provider they include.
 */
export function apiProvidersInterface(root: RootContext): string {
	const jacksonRsPackage = root.useJakarta ? 'jakarta.rs' : 'jaxrs'
	const providerClass = root.useJakarta ? 'JacksonXmlBindJsonProvider' : 'JacksonJaxbJsonProvider'

	return ts`
package ${root.apiPackage};

${generatedAnnotation(root)}
public interface ApiProviders {

	static java.util.List<?> defaultProviders() {
		java.util.List<Object> providers = new java.util.ArrayList<>();
		${apiProviders(root)}
		return providers;
	}

	class MyJacksonJaxbJsonProvider extends com.fasterxml.jackson.${jacksonRsPackage}.json.${providerClass} {

		public MyJacksonJaxbJsonProvider() {
			super();

			final com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();

			${apiProvidersJsonProvider()}

			setMapper(mapper);
		}

	}

}
`
}
