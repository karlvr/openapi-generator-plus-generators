import { ts } from '@openapi-generator-plus/template-utils'
import { RootContext, javax } from '@openapi-generator-plus/java-jaxrs-generator-common'

/** Configures the local CXF/Weld environment used by the generated API tests. */
export function testConfiguration(root: RootContext): string {
	const jx = javax(root.useJakarta)
	const jacksonProvider = root.useJakarta ? 'JacksonXmlBindJsonProvider' : 'JacksonJaxbJsonProvider'
	const jacksonProviderPackage = root.useJakarta ? 'jakarta.rs' : 'jaxrs'

	return ts`
package ${root.apiPackage};

import java.util.ArrayList;
import java.util.List;

import ${jx}.enterprise.context.Dependent;

import org.apache.cxf.jaxrs.JAXRSServerFactoryBean;
import org.apache.cxf.jaxrs.ext.JAXRSServerFactoryCustomizationExtension;

import com.fasterxml.jackson.${jacksonProviderPackage}.json.${jacksonProvider};

/**
 * Configures the environment for testing.
 */
@Dependent
public class TestConfiguration implements JAXRSServerFactoryCustomizationExtension {

	public static final String ENDPOINT_ADDRESS = "local://api";

	/**
	 * Configures the {@link JAXRSServerFactoryBean} so that it uses the local connection
	 * for testing, which is higher performance than using a servlet server.
	 */
	@Override
	public void customize(JAXRSServerFactoryBean bean) {
		bean.setAddress(ENDPOINT_ADDRESS);
	}

	public static List<Object> defaultProviders() {
		List<Object> providers = new ArrayList<>();
		providers.add(new ${jacksonProvider}());
		return providers;
	}

}
`
}
