---
"@openapi-generator-plus/java-jaxrs-generator-common": minor
---

Use `Set` for uniqueItems in parameters so we maintain the uniqueItems metadata

Without it, we cannot indicate the `uniqueItems` metadata as it isn't available in the metadata annotations.
This impacts the output of the automatic OpenAPI schema output endpoint.
