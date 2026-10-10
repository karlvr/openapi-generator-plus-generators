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

A query parameter, a header parameter and a path parameter use Retrofit's own annotations. Each operation declares
the media type that it accepts, so the client sends an `Accept` header.

## Limitations

The [client conformance suite](../client-conformance) records the gaps below. Retrofit describes a request with
annotations, and it has no model of the OpenAPI serialization styles, of a cookie parameter, or of a security
scheme. So the generator cannot express some of what an API declares.

### The client sends no credential

The generator emits no security mechanism. An operation that a security scheme protects takes no credential, and
the client sends none. This applies to every scheme, which includes an API key, an HTTP bearer token and HTTP
basic authentication. Add an OkHttp interceptor to your `OkHttpClient` to write the credential yourself.

### Retrofit repeats a joined query array or header

Retrofit writes one value for each element of a collection. So a style that joins the elements of a query array,
or that writes an object as more than one value, does not reach the wire in the form that the API declares. Those
styles are:

* `pipeDelimited` and `spaceDelimited` on a query array
* every object style on a query parameter, which Retrofit writes as the `toString()` of the model
* an array in a header parameter, which Retrofit repeats rather than joins

An `explode: false` query array does reach the wire correctly, because the generator gives it its own type, which
`ApiConverterFactory` joins.

### The client drops a cookie parameter

Retrofit has no cookie annotation. The generator drops a cookie parameter, so the client sends no `Cookie` header.
Add an OkHttp interceptor to write the header yourself.

### A text body and a binary body go out as JSON

The generator writes no `Content-Type` annotation, and `ApiConverterFactory` answers only for the request models
that it generates. So an operation with a `text/plain` body or an `application/octet-stream` body reaches the
factory that writes JSON, and the client sends `application/json`.

### A caller parses a documented error body

Each operation declares one body type, which is the type of the success response. Retrofit gives the body of a
failure response as an unparsed `ResponseBody`. So a caller parses a documented error body itself, even where the
API declares a model for it.

### A caller cannot leave out an optional request body

Retrofit throws for a null `@Body`. So a caller must send a request body, even where the API marks it as
optional.

### A caller reads a response header as text

Retrofit gives each header as the text that the response carries. So a caller splits a list header and parses
each value itself. The client does not check that a required header is present, or that a value parses as its
declared type.

### The client parses a response body of any media type

A response that carries no `Content-Type` header still reaches the factory that reads JSON. So the client does not
see that the server said nothing about the body, and it may give a model for a body of another media type.

## Config file

See [java-jaxrs-client-generator](https://github.com/karlvr/openapi-generator-plus-generators/tree/master/packages/java-jaxrs-client)
for the config options that every Java generator in this family takes. This generator adds none of its own, and
defaults `apiProviderPackage` and `apiParamsPackage` to null, because a Retrofit project uses neither.

### Maven versions

`maven.versions` takes `retrofit`, `retrofit_converter` and `okhttp`, along with the versions that every Java
generator in this family takes.
