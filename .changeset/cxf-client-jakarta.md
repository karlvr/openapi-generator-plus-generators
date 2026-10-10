---
"@openapi-generator-plus/java-cxf-client-generator": major
"@openapi-generator-plus/java-jaxrs-generator-common": patch
---

Use CXF 4 when `useJakarta` is set.

CXF 3 uses the `javax` packages and CXF 4 uses the `jakarta` packages, but the generated project
got CXF 3 either way. A `javax` CXF cannot read the `jakarta` annotations that the generator emits,
so the client could not work at all. The multipart body and the cookie API key also named the
`javax` types.

The default is now 4.1.4 when `useJakarta` is set. Set `maven.versions.cxf` to choose another.
