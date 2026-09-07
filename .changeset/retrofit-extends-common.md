---
"@openapi-generator-plus/java-jaxrs-generator-common": minor
"@openapi-generator-plus/java-jaxrs-client-generator": minor
"@openapi-generator-plus/java-retrofit-client-generator": minor
---

Build the Retrofit client on the shared Java generator, not on the JAX-RS client.

The Retrofit generator extended `java-jaxrs-client`, which emits a JAX-RS interface, an
implementation of it, an invoker, providers, parameter classes and exceptions. A Retrofit
project can use none of those. What it did use was the model layer, which
`java-jaxrs-generator-common` supplies, and two client templates that `java-jaxrs-client` held.

The Retrofit generator now extends `java-jaxrs-generator-common` directly, and declares its own
options, its own emitted files and its own generator type.

The two templates now belong to `java-jaxrs-generator-common`, where every client in the family
can reach them. `apiConstants` renders the `ApiConstants` interface, and
`clientPojoPropertyAnnotations` renders the `@JsonProperty` annotation in the direction that a
client needs. Neither is emitted by that package, so a server generator is unaffected.

`formUrlEncodedImplementation` may now return null, which keeps the type that the request
body's own schema gives. A generator that encodes a form body itself needs that type, because
it reads each property.
