# Java CXF Client API generator for OpenAPI Generator Plus

An [OpenAPI Generator Plus](https://github.com/karlvr/openapi-generator-plus) template for a Java API client using CXF

See [java-jaxrs-client-generator](https://github.com/karlvr/openapi-generator-plus-generators/tree/master/packages/java-jaxrs-client) for documentation.

The Java CXF client API includes interfaces and default implementations to invoke the API. These are created
in the `impl` package.

## Requests and responses

See [java-jaxrs-client-generator](https://github.com/karlvr/openapi-generator-plus-generators/tree/master/packages/java-jaxrs-client#requests)
for the request body that an operation takes, and for what it returns and throws.

## Limitations

The [client conformance suite](../client-conformance) records these gaps. JAX-RS has no model of the
OpenAPI serialization styles, so the generator gives each style its own type or converter. It does not
cover these styles yet.

### A `pipeDelimited` or `spaceDelimited` query array repeats

The generator gives an `explode: false` query array its own type, and a `ParamConverter` joins the
elements with a ",". A `pipeDelimited` array and a `spaceDelimited` array get a plain
`java.util.List`. JAX-RS writes one parameter for each element of a `List`, so those two styles do
not reach the wire in the declared form.

### An object query parameter is written with `toString()`

The generator declares an object query parameter as the model type. JAX-RS has no converter for the
model, so it writes the `toString()` of the model. This affects `explode: true`, `explode: false`
and `deepObject` alike.

### An array header is written with `toString()`

An array header parameter gets a plain `java.util.List`, so JAX-RS writes the `toString()` of the
list. The specification asks for the elements joined with a ",".

## Config file

See [java-jaxrs-client-generator](https://github.com/karlvr/openapi-generator-plus-generators/tree/master/packages/java-jaxrs-client) for config file documentation.

### Maven versions

`maven.versions` takes `cxf`, along with the versions that every Java generator in this family takes. The
default is `3.6.9`, or `4.1.4` when `useJakarta` is set, because CXF 3 uses the `javax` packages and CXF 4
uses the `jakarta` packages.
