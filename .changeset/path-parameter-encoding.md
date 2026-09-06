---
"@openapi-generator-plus/java-jaxrs-client-generator": minor
"@openapi-generator-plus/java-cxf-client-generator": minor
---

Percent encode a string path parameter.

The JAX-RS client builds its URI from values that it takes as already encoded. It escapes
only what a URI cannot carry at all, and a `/` needs no escape there. So a value with a `/`
added a path segment, and the request reached a different resource. A `?` in a value started
a query in the same way.

The generated project now registers a `PathParamConverterProvider`, which percent encodes a
string path parameter before the client builds the URI. The value then stays inside its own
segment.

The provider encodes more than a path segment strictly needs, such as `:` and `@`. A server
decodes the segment either way, so the value that arrives is the same.
