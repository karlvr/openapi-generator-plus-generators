---
"@openapi-generator-plus/java-jaxrs-generator-common": minor
"@openapi-generator-plus/java-cxf-client-generator": minor
"@openapi-generator-plus/java-cxf-cdi-server-generator": minor
"@openapi-generator-plus/java-cxf-spring-server-generator": minor
"@openapi-generator-plus/java-jaxrs-client-generator": minor
"@openapi-generator-plus/java-jaxrs-server-generator": minor
"@openapi-generator-plus/java-retrofit-client-generator": minor
---

Send a discriminator value with the type that the spec gives it

The pojo for a discriminator previously used `@JsonTypeInfo(include = As.PROPERTY)` which Jackson always writes as a JSON string. A spec with another discriminator property type, such as a boolean or an integer, got the wrong type on the wire.

The pojo now keeps a real field for the discriminator property, and uses
`@JsonTypeInfo(include = As.EXISTING_PROPERTY, visible = true)`. Jackson reads and writes that field,
so the value keeps the type that the spec gives it, and a caller can read the value from a pojo.

A member of a discriminator sets the correct value in its constructor. A member of discriminators
that disagree on its value sets none, because no one value names it, so the caller sets the value of
the discriminator that it sends the member through.

This changes the JSON that a client sends, and that a server answers with, for a discriminator that
is not a string. The other side of the API may need to accept the correct form as well.
