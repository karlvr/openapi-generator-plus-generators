import { JavaJaxrsTemplates } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { api } from './api'
import { pom } from './pom'

/**
 * This generator's whole-template overrides of `java-jaxrs-client`'s extension points: its own
 * Retrofit-annotated `Api.java` interface (see `api.ts`) and its own `pom.xml` (see `pom.ts`) —
 * both self-contained, replacing the JAX-RS-oriented defaults entirely rather than extending
 * them via the family's smaller hook points.
 */
export const hooks: Partial<JavaJaxrsTemplates> = {
	api,
	pom,
}
