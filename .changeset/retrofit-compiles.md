---
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

**Breaking:** a generated project no longer holds the JAX-RS classes. Use java-cxf-client for a
JAX-RS client.
