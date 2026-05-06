---
"@openapi-generator-plus/java-jaxrs-server-generator": minor
---

Remove `ResponseBuilder` parameter from service methods with no return type

We now have support for response headers so there is no longer any reason to have the `ResponseBuilder` parameter (not that it really made sense in the first place except as a workaround for responses the generator didn't support).
