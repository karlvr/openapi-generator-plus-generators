---
"@openapi-generator-plus/java-retrofit-client-generator": patch
---

Send a Retrofit request to the operation's own path, under the names that the API declares.

The generated `@GET`/`@POST` annotation carried the operation's path within its own group, not
the whole path. An operation at `/query/scalars` was annotated `/arrays`, so every request in a
grouped API reached the wrong resource. The annotation now carries the whole path.

The path is now relative, with no leading "/". Retrofit resolves a path that starts with "/"
against the root of the host, which discards any path that the base URL carries. A base URL
such as `https://example.com/api/v1/` now reaches the operation. Retrofit itself requires the
base URL to end with "/".

A parameter annotation now carries the name that the API declares, not the name that the
generator made safe to use in Java. A header named `X-Text` was sent as `xText`, and a path
parameter whose name needed escaping no longer matched its own placeholder.

A form parameter is now annotated `@Field`, and its operation `@FormUrlEncoded`. It was
annotated `@FormUrlEncoded`, which is a method annotation that takes no value, so an API that
declared one did not compile.
