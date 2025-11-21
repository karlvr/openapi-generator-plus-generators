---
"@openapi-generator-plus/java-jaxrs-client-generator": minor
---

Make `UnexpectedApiException` into a checked `Exception` by default.
For those who want to use it as a `RuntimeException`, this can be enabled with the `useRuntimeUnexpectedExceptions` config option.

Additionally, we have reworked `UnexpectedApiException` to be `abstract`.
Previously `UnexpectedApiException` was acting as both a superclass and a concrete implementation.
Now it is only a superclass and `UnexpectedApiProcessingException` has taken the role of the concrete implementation.