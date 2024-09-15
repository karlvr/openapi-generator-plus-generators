---
"@openapi-generator-plus/typescript-fetch-node-client-generator": minor
"@openapi-generator-plus/typescript-fetch-client-generator2": minor
"@openapi-generator-plus/typescript-fetch-client-generator": minor
"@openapi-generator-plus/plain-documentation-generator": minor
"@openapi-generator-plus/java-jaxrs-client-generator": minor
"@openapi-generator-plus/java-jaxrs-generator-common": minor
"@openapi-generator-plus/java-jaxrs-server-generator": minor
"@openapi-generator-plus/typescript-generator-common": minor
"@openapi-generator-plus/java-like-generator-helper": minor
---

Add `enumMemberStyle` option with new `preserve` option

The actual naming of the enum members can be really important. We default to the old behaviour, which is to name the enum members according
to the preferred constant style of the language being generated, but we now add an option to try to preserve the enum member names from the
API spec. Preserving is important if you use the enum member names in code such as by serializing them or matching them by their string names,
e.g. Java's `EnumType.valueOf(String)`.
