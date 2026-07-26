import { ts } from '@openapi-generator-plus/template-utils'
import { RootContext, generatedAnnotation } from '@openapi-generator-plus/java-jaxrs-generator-common'

/**
 * The abstract base of the generated Jackson JAX-RS JSON provider, configuring the
 * `ObjectMapper` used to (de)serialise request/response bodies.
 */
export function abstractApiJaxbJsonProvider(root: RootContext): string {
	const apiProviderPackage = root.apiProviderPackage
	if (!apiProviderPackage) {
		throw new Error('abstractApiJaxbJsonProvider requires apiProviderPackage to be set')
	}

	const jacksonRsPackage = root.useJakarta ? 'jakarta.rs' : 'jaxrs'
	const providerClass = root.useJakarta ? 'JacksonXmlBindJsonProvider' : 'JacksonJaxbJsonProvider'

	return ts`
package ${apiProviderPackage};

${generatedAnnotation(root)}
public abstract class AbstractApiJaxbJsonProvider extends com.fasterxml.jackson.${jacksonRsPackage}.json.${providerClass} {

	public AbstractApiJaxbJsonProvider() {
		super();

		this.setMapper(createMapper());
	}

	protected com.fasterxml.jackson.databind.ObjectMapper createMapper() {
		com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();

		/* We don't serialise null values so the client can treat them as null or undefined as they see fit */
		mapper.setSerializationInclusion(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL);

		/* Support PATCH requests using java.util.Optional */
		if (isRegisterJdk8Module()) {
			mapper.registerModule(createJdk8Module());
		}

		/* Support Java time object types */
		mapper.registerModule(createJavaTimeModule());
		mapper.configure(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, isWriteDatesAsTimestamps());

		return mapper;
	}

	protected boolean isRegisterJdk8Module() {
		return true;
	}

	protected com.fasterxml.jackson.datatype.jdk8.Jdk8Module createJdk8Module() {
		return new com.fasterxml.jackson.datatype.jdk8.Jdk8Module();
	}

	protected com.fasterxml.jackson.datatype.jsr310.JavaTimeModule createJavaTimeModule() {
		return new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule();
	}

	protected boolean isWriteDatesAsTimestamps() {
		return false;
	}

}
`
}
