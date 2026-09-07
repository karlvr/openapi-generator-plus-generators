import { clientObjectMapperConfiguration } from '@openapi-generator-plus/java-jaxrs-generator-common'

/** The `ObjectMapper` configuration shared by the generated Jackson JAX-RS JSON provider. */
export function apiProvidersJsonProvider(): string {
	return clientObjectMapperConfiguration()
}
