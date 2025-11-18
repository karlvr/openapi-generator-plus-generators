---
"@openapi-generator-plus/java-jaxrs-client-generator": minor
---

Make `UnexpectedApiException` into a checked `Exception` by default.
For those who want to use it as a `RuntimeException`, this can be enabled with the `useRuntimeUnexpectedExceptions` config option.
