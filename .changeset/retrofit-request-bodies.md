---
"@openapi-generator-plus/java-jaxrs-generator-common": minor
"@openapi-generator-plus/java-jaxrs-client-generator": patch
"@openapi-generator-plus/java-retrofit-client-generator": minor
---

Send a form request body and a multipart request body from the Retrofit client.

The generator refused an API that declared either. Retrofit describes a request with annotations
alone, and it has no annotation for the encoding styles that OpenAPI declares: `@Field` and
`@Part` each describe one property, and neither carries a style.

The body now reaches the interface as a whole request model, under `@Body`, the same as a JSON
body does. A new generated class, `ApiConverterFactory`, encodes the model. It is a Retrofit
`Converter.Factory`, which is where Retrofit expects a caller to put an encoding that its own
annotations cannot express. The generated `README` shows how to register it.

The factory writes each style that the API declares: an array joined, or exploded; an object
joined, exploded, or as a `deepObject`; and a multipart part that declares its own media type or
its own headers. A null value writes the form that its own encoding carries, and an absent value
is left out, so the two stay distinct.

The factory also joins an `explode: false` query array, which Retrofit would otherwise repeat.

A second generated class, `ApiObjectMapper`, holds the Jackson configuration that the models
expect. A caller passes it to the factory that reads and writes JSON. Retrofit leaves that
configuration to the caller, and a mapper without it sends every unset value as null.

The generated `pom.xml` now declares OkHttp, which the converter factory uses to build a form
body and a multipart body.

`java-jaxrs-generator-common` now exports `clientObjectMapperConfiguration`, `isPrimitive` and
`JAVA_PRIMITIVE_TYPES`. The first is the Jackson configuration that both clients share, and the
other two report which values this family writes as a Java primitive, which has no null to test
for.
