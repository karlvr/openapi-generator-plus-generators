# Java CXF Client API generator for OpenAPI Generator Plus

An [OpenAPI Generator Plus](https://github.com/karlvr/openapi-generator-plus) template for a Java API server using CXF

See [java-jaxrs-client-generator](https://github.com/karlvr/openapi-generator-plus-generators/tree/master/packages/java-jaxrs-client) for documentation.

The Java CXF client API includes interfaces and default implementations to invoke the API. These are created
in the `impl` package.

## Config file

See [java-jaxrs-client-generator](https://github.com/karlvr/openapi-generator-plus-generators/tree/master/packages/java-jaxrs-client) for config file
documentation. Below are additional config file options supported by this generator.

### Project layout

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`invokerPackage`|`string`|Package for API invoker classes.|`"${package}.invoker"`|
|`invokerImplPackage`|`string`|Package for API invoker implementation classes.|`"${invokerPackage}.impl"`|
