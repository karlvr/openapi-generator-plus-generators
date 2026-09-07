import { clientPojoPropertyAnnotations, JavaJaxrsTemplates } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { api } from './api'
import { pom } from './pom'

/**
 * This generator's overrides of the shared Java generator's extension points: the client
 * flavour of the model property annotations, its own Retrofit-annotated `Api.java` interface
 * (see `api.ts`) and its own `pom.xml` (see `pom.ts`).
 *
 * The interface and the `pom.xml` are self-contained. Retrofit describes a request with its
 * own annotations, so neither has anything in common with the JAX-RS generators.
 */
export const hooks: Partial<JavaJaxrsTemplates> = {
	pojoPropertyAnnotations: clientPojoPropertyAnnotations,
	api,
	pom,
}
