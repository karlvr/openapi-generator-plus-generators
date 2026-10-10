# Java CXF Client API generator for OpenAPI Generator Plus

An [OpenAPI Generator Plus](https://github.com/karlvr/openapi-generator-plus) template for a Java API client using CXF

See [java-jaxrs-client-generator](https://github.com/karlvr/openapi-generator-plus-generators/tree/master/packages/java-jaxrs-client) for documentation.

The Java CXF client API includes interfaces and default implementations to invoke the API. These are created
in the `impl` package.

## Responses

See [java-jaxrs-client-generator](https://github.com/karlvr/openapi-generator-plus-generators/tree/master/packages/java-jaxrs-client#responses)
for what an operation returns and throws, and for the headers that a response carries.

## Config file

See [java-jaxrs-client-generator](https://github.com/karlvr/openapi-generator-plus-generators/tree/master/packages/java-jaxrs-client) for config file documentation.

### Maven versions

`maven.versions` takes `cxf`, along with the versions that every Java generator in this family takes. The
default is `3.6.9`, or `4.1.4` when `useJakarta` is set, because CXF 3 uses the `javax` packages and CXF 4
uses the `jakarta` packages.
