---
"@openapi-generator-plus/generator-common": minor
"@openapi-generator-plus/java-jaxrs-generator-common": minor
---

Don't generate default values for properties for clients

The client should not send a value, and the server is expected to use its default value.
Note this from the [OpenAPI specification](https://swagger.io/specification/#schema-object):

> `default` - The default value represents what would be assumed by the consumer of the input as the value of the schema if one is not provided.

*NOTE*: For Java clients some properties may be `null` where they previously had values when the object was constructed. Please check any differences in your generated code
and check that your code won't cause a `NullPointerException` at runtime.
