---
"@openapi-generator-plus/java-jaxrs-server-generator": minor
---

Change RestApplication / invoker to explicitly initialize the JAX-RS application

This is to improve security and sureity of your JAX-RS application so you know exactly which
endpoints and providers are in play, rather than using automatic discovery.
