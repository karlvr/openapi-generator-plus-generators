---
"@openapi-generator-plus/java-jaxrs-server-generator": patch
---

Let the generated JAX-RS server project compile.

Two faults stopped it. The generated `Abstract<Invoker>` built each endpoint from
`<apiPackage>.<Name>ApiImpl`, but the implementation goes in `apiImplPackage`, which is a
different package by default. And the `pom.xml` declared neither `javax.annotation-api` nor
`jaxb-api`, which the generated code needs since Java 11 removed both from the JDK.

Neither showed up before, because the suite rendered the templates without compiling them.
It now compiles a generated project, in both the javax and the jakarta variant.

The CXF server generators were unaffected. Their own `inject` hook injects the interface, so
neither named the implementation class.
