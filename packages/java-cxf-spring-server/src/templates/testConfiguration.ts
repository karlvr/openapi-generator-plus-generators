import { ts } from '@openapi-generator-plus/template-utils'
import { RootContext } from '@openapi-generator-plus/java-jaxrs-generator-common'

/** Configures the local CXF/Spring environment used by the generated API tests. */
export function testConfiguration(root: RootContext): string {
	const jacksonProvider = root.useJakarta ? 'JacksonXmlBindJsonProvider' : 'JacksonJaxbJsonProvider'
	const jacksonProviderPackage = root.useJakarta ? 'jakarta.rs' : 'jaxrs'

	return ts`
package ${root.apiPackage};

import java.util.ArrayList;
import java.util.List;

import org.apache.cxf.BusFactory;
import org.apache.cxf.bus.spring.SpringBus;
import org.apache.cxf.jaxrs.spring.JAXRSServerFactoryBeanDefinitionParser.SpringJAXRSServerFactoryBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

import com.fasterxml.jackson.${jacksonProviderPackage}.json.${jacksonProvider};

@Configuration
@ComponentScan
public class TestConfiguration {

	public static final String ENDPOINT_ADDRESS = "local://api";

	@Autowired
	private ApplicationContext context;

	@Bean
	public SpringJAXRSServerFactoryBean serverFactory() {
		SpringJAXRSServerFactoryBean sf = new SpringJAXRSServerFactoryBean();
		sf.setApplicationContext(context);

		/* We create and set a default bus so our clients use the same bus as we're using local transport */
		SpringBus bus = new SpringBus();
		BusFactory.setDefaultBus(bus);
		sf.setBus(bus);

		sf.setProviders(defaultProviders());
		sf.setAddress(ENDPOINT_ADDRESS);
		return sf;
	}

	public static List<Object> defaultProviders() {
		List<Object> providers = new ArrayList<>();
		providers.add(new ${jacksonProvider}());
		return providers;
	}

}
`
}
