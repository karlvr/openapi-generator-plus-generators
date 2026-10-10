---
"@openapi-generator-plus/java-jaxrs-client-generator": minor
"@openapi-generator-plus/java-cxf-client-generator": minor
---

Report a failure when a response that declares content carries no body.

The client returned null, so a caller could not tell an empty body from a model whose every property
was absent. An operation now throws `UnprocessableResponseException`, which carries the response.
