---
"@openapi-generator-plus/typescript-fetch-node-client-generator": patch
"@openapi-generator-plus/typescript-fetch-client-generator2": patch
"@openapi-generator-plus/typescript-fetch-client-generator": patch
"@openapi-generator-plus/handlebars-templates": patch
"@openapi-generator-plus/java-jaxrs-client-generator": patch
"@openapi-generator-plus/java-jaxrs-generator-common": patch
"@openapi-generator-plus/typescript-generator-common": patch
---

Update templates for changes to multipart file properties to no longer contain metadata generated in core. If we want to bring back metadata in a generator template we'll need to add a specific FILE type to store that.
