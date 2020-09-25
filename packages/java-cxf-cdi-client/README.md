# Java CXF + CDI Client API generator for OpenAPI Generator+

An [OpenAPI Generator+](https://github.com/karlvr/openapi-generator-plus) module for a Java API server using CXF and CDI annotations

See [java-jaxrs-client-generator](https://github.com/karlvr/openapi-generator-plus-generators/tree/master/packages/java-jaxrs-client) for documentation.

The Java CXF + CDI client API includes interfaces and default implementations to invoke the API. These are created
in the `invokerPackage` package.

## Config file

See [java-jaxrs-client-generator](https://github.com/karlvr/openapi-generator-plus-generators/tree/master/packages/java-jaxrs-client) for config file
documentation. Below are additional config file options supported by this generator.

### Project layout

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`invokerPackage`|`string`|Package for API invoker classes.|`"${package}.invoker"`|
|`invokerImplPackage`|`string`|Package for API invoker implementation classes.|`"${invokerPackage}.impl"`|
