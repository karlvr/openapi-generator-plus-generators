---
"@openapi-generator-plus/typescript-fetch-client-generator2": patch
"@openapi-generator-plus/java-jaxrs-server-generator": patch
---

Compile an operation whose `default` response has no content

The TypeScript client named the interface for such a response differently in the response union and
in its declaration, and typed its status as `default`. It now uses one name in both places, and the
status of a catch-all response is a `number`.

The Java server sent `Response.status(default)` when the success response was the `default`
response. It now sends 200, because a catch-all response documents no status code.
