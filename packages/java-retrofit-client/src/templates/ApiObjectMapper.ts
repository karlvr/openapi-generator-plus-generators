import { ts, indent } from '@openapi-generator-plus/template-utils'
import { clientObjectMapperConfiguration, generatedAnnotation, RootContext } from '@openapi-generator-plus/java-jaxrs-generator-common'

/**
 * The generated `ApiObjectMapper` class: the Jackson configuration that the generated models
 * expect.
 *
 * Retrofit reads and writes JSON through a converter factory that the caller supplies, so the
 * caller owns the `ObjectMapper`. This gives the caller one that already reads and writes the
 * models correctly.
 */
export function apiObjectMapper(root: RootContext): string {
	return ts`
package ${root.apiPackage};

/**
 * The Jackson configuration that this API's models expect.
 * <p>
 * Pass the mapper that {@link #create()} returns to {@code JacksonConverterFactory.create()},
 * and to {@link ${root.apiPackage}.ApiConverterFactory}, so that both read and write the models
 * the same way.
 */
${generatedAnnotation(root)}
public final class ApiObjectMapper {

	private ApiObjectMapper() {
	}

	/**
	 * A new mapper that reads and writes this API's models.
	 *
	 * @return a mapper that the caller owns, and may configure further
	 */
	public static com.fasterxml.jackson.databind.ObjectMapper create() {
		final com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();

${indent(clientObjectMapperConfiguration(), '\t\t')}

		return mapper;
	}

}
`
}
