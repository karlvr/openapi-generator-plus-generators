# Java Retrofit client API generator for OpenAPI Generator Plus

An [OpenAPI Generator Plus](https://github.com/karlvr/openapi-generator-plus) template for a Java API client using
[Retrofit](https://square.github.io/retrofit/) annotations.

The generator emits one Retrofit interface for each operation group, the models that the API declares, and the
support classes that a caller needs to build a `Retrofit` instance.

## Using the generated client

```java
com.fasterxml.jackson.databind.ObjectMapper mapper = com.example.ApiObjectMapper.create();

retrofit2.Retrofit retrofit = new retrofit2.Retrofit.Builder()
    .baseUrl(com.example.ApiConstants.DEFAULT_SERVER + "/")
    .addConverterFactory(new com.example.ApiConverterFactory(mapper))
    .addConverterFactory(retrofit2.converter.jackson.JacksonConverterFactory.create(mapper))
    .build();

com.example.QueryApi api = retrofit.create(com.example.QueryApi.class);
```

Retrofit requires the base URL to end with `/`. Each operation carries a relative path, so a server URL that holds
a path of its own, such as `https://example.com/api/v1/`, reaches the operation.

`ApiConverterFactory` must come before the factory that reads and writes JSON. It answers only for the values that
the API's own encoding describes, and leaves everything else to the next factory.

`ApiObjectMapper.create()` returns a mapper that reads and writes the generated models. It sends only the values
that a caller set, so a PATCH request leaves every other value alone.

## What the generated client sends

A form request body and a multipart request body reach the interface as a whole request model, under `@Body`.
`ApiConverterFactory` encodes the model in the styles that the API declares, including the joined, exploded and
`deepObject` styles, and a part that declares its own media type or its own headers.

A query parameter and a header parameter use Retrofit's own annotations. Retrofit writes one value for each
element of a collection, so a style that joins the elements of a query array, or that writes an object as more
than one value, does not reach the wire in the form that the API declares. Those styles are:

* `pipeDelimited` and `spaceDelimited` on a query array
* every object style on a query parameter
* an array in a header parameter, which Retrofit repeats rather than joins

An `explode: false` query array does reach the wire correctly, because the generator gives it its own type, which
`ApiConverterFactory` joins.

## Config file

See [java-jaxrs-client-generator](https://github.com/karlvr/openapi-generator-plus-generators/tree/master/packages/java-jaxrs-client)
for the config options that every Java generator in this family takes. This generator adds none of its own, and
defaults `apiProviderPackage` and `apiParamsPackage` to null, because a Retrofit project uses neither.

### Maven versions

`maven.versions` takes `retrofit`, `retrofit_converter` and `okhttp`, along with the versions that every Java
generator in this family takes.
