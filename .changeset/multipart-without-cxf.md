---
"@openapi-generator-plus/java-jaxrs-generator-common": minor
"@openapi-generator-plus/java-jaxrs-client-generator": major
"@openapi-generator-plus/java-jaxrs-server-generator": major
"@openapi-generator-plus/java-retrofit-client-generator": major
"@openapi-generator-plus/java-cxf-client-generator": patch
"@openapi-generator-plus/java-cxf-cdi-server-generator": patch
"@openapi-generator-plus/java-cxf-spring-server-generator": patch
---

Stop the JAX-RS generators emitting CXF types for a multipart body.

The JAX-RS client and server rendered a multipart request body with
`org.apache.cxf.jaxrs.ext.multipart.MultipartBody`, and neither `pom.xml` declared CXF. So a
generated project did not compile unless its author added CXF themselves, and a project that
used another JAX-RS implementation could not use the code at all.

JAX-RS 2.1 declares no multipart API. Each implementation invented its own, so a generator
that names no implementation cannot express a multipart body. Jakarta REST 3.1 added
`EntityPart`, which every implementation of that version supplies.

The JAX-RS generators now render `List<EntityPart>` when the `useJakarta` option is set. Without
it they refuse to generate a multipart request body, and report why. Use a generator that names
one implementation for a `javax` project, such as java-cxf-client.

The CXF generators are unchanged. They now select CXF's multipart API through the new
`multipartBodyType`, `multipartBodyBuilding` and `multipartBodyParsing` hooks, which
`cxfMultipartTemplates` supplies. A generator for another implementation can supply its own.

**Breaking:** generating a multipart request body with java-jaxrs-client, java-jaxrs-server or
java-retrofit-client, without `useJakarta`, now fails rather than emitting CXF types.
