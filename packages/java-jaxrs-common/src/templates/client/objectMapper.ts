/**
 * The statements that configure an `ObjectMapper` named `mapper` to read and write the models
 * that this generator family emits.
 *
 * A client sends only the values that its caller set, so that a PATCH request leaves every
 * other value alone. An absent value is a Java null, and a null value is an empty `Optional`,
 * which is why the mapper excludes null but keeps the empty `Optional`.
 */
export function clientObjectMapperConfiguration(): string {
	return `/* Support PATCH requests, since we need to NOT serialise the values we're not trying to patch */
mapper.setSerializationInclusion(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL);

/* Support PATCH requests using java.util.Optional */
mapper.registerModule(new com.fasterxml.jackson.datatype.jdk8.Jdk8Module());

/* Support Java time object types */
mapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
mapper.configure(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);

/* Ignore unknown properties received from the server */
mapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);`
}
