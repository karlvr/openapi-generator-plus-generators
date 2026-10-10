---
"@openapi-generator-plus/java-jaxrs-client-generator": major
"@openapi-generator-plus/java-cxf-client-generator": major
---

Throw the documented exception for a non-default response that has a 2xx status.

The client throws for every response other than the default one, whatever its status. But a JAX-RS
client only throws at 300 and above, so the exception generated for a documented 201 or 204 could
never be thrown, and that response was reported as if it were the default response.

Each `ApiSpec` method now returns a JAX-RS `Response`, and the implementation reads the status
itself. Catch the exceptions that now arrive, and update any code that implements or mocks
`ApiSpec`.
