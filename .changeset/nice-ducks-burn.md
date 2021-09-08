---
"@openapi-generator-plus/java-jaxrs-generator-common": patch
"@openapi-generator-plus/typescript-generator-common": patch
---

Fix date and time native types

This was broken in the previous release in the TypeScript generator, and generating dates and times in
parameters would have failed.
