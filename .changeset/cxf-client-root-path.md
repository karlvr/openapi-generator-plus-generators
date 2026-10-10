---
"@openapi-generator-plus/java-cxf-client-generator": patch
---

Call an operation at the root of the server URL with its "/".

An operation whose path is `/` called the server URL itself. A server URL of
`https://example.com/api/v1` should give `https://example.com/api/v1/`, but the client called
`https://example.com/api/v1`, because the CXF client proxy leaves out a path of "/".

The client now adds a "/" to a base address that does not end with one. Every other path reaches
the same URL as before.
