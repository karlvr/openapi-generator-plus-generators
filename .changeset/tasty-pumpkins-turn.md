---
"@openapi-generator-plus/java-jaxrs-client-generator": minor
"@openapi-generator-plus/java-jaxrs-generator-common": minor
"@openapi-generator-plus/java-jaxrs-server-generator": minor
---

Support externalDocs on operations and pojos, and improve documentation formatting

We now apply the markdown formatting in all JavaDoc comments. They're supposed to be HTML
and IDEs expect them to be HTML formatted, so it improves the display in the IDE.
