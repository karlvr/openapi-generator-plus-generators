---
"@openapi-generator-plus/java-jaxrs-client-generator": minor
"@openapi-generator-plus/java-retrofit-client-generator": major
---

Generate a Retrofit project that compiles.

The generator emitted its own Retrofit interface, and the whole JAX-RS client alongside it:
the JAX-RS interface, its implementation, the invoker, the providers, the parameter classes
and the exceptions. Its `pom.xml` declares no JAX-RS implementation, so none of that
compiled. The generated project could not be built at all.

The generator now emits only what a Retrofit project uses: its own interface, the models,
the support classes and `ApiConstants`.

The `pom.xml` gains the pieces the remaining code needs, and loses one it does not. It now
declares `swagger-annotations`, which the models carry, and the annotation packages that
Java 11 removed from the JDK. It declares Retrofit's own Jackson converter in place of the
JAX-RS Jackson provider, which had nothing to register with.

java-jaxrs-client gains an `emitJaxrsClient` flag on its generator context. A generator that
renders its own client through the `api` template sets it to false.

The generator also refuses a multipart or form request body now. Retrofit encodes each with its
own annotations, one per property, and this generator writes neither. It rendered a plain
`@Body` instead, which sends the body as JSON, and a form body reached the signature as
`javax.ws.rs.core.Form`, which no longer resolves.

**Breaking:** a generated project no longer holds the JAX-RS classes, and an API with a
multipart or form request body no longer generates. Use java-cxf-client for either.
