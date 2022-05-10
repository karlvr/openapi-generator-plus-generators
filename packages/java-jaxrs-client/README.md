# Java JAX-RS Client API generator for OpenAPI Generator Plus

An [OpenAPI Generator Plus](https://github.com/karlvr/openapi-generator-plus) template for a Java API client using JAX-RS.

## Overview

The generated code has useful features:

* Model objects and enums will be nested in the API service if they are inlined in the specification.

## Using

See the [OpenAPI Generator Plus](https://github.com/karlvr/openapi-generator-plus) documentation for how to use
generator templates.

## Config file

The available config file properties are:

### Project layout

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`package`|`string`|Base package name that other default package names will be based on.|`"com.example"`|
|`apiPackage`|`string`|Package for API interfaces.|`"${package}"`|
|`apiImplPackage`|`string`|Package for API implementation classes.|`"${package}.impl"`|
|`apiSpecPackage`|`string`|Package for JAX-RS API interfaces.|`"${package}.spec"`|
|`apiSpiPackage`|`string`|Package for SPI interfaces for extra functionality.|`"${package}.spi`|
|`modelPackage`|`string`|Package for API model classes.|`"${package}.model"`|
|`relativeSourceOutputPath`|`string`|The path to output generated source code, relative to the output path.|`./` or `./src/main/java` if `maven` is specified.|

### Code style

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`useBeanValidation`|`boolean`|Whether to use bean validation.|`true`|
|`dateImplementation`|`string`|Date type class.|`"java.time.LocalDate"`|
|`timeImplementation`|`string`|Time type class.|`"java.time.LocalTime"`|
|`dateTimeImplementation`|`string`|Date time type class.|`"java.time.OffsetDateTime"`|
|`binaryRepresentation`|`string`|Binary data representation.|`"byte[]"`|
|`constantStyle`|`"allCapsSnake"|"allCaps"|"camelCase"`|The style to use for constant naming.|`"allCapsSnake"`|
|`useJakarta`|`boolean`|Whether to use `jakarta` packages instead of `javax` packages.|`false`|

### Behaviour

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`connectionTimeoutMillis`|`number`|The number of milliseconds to wait to connect to the API server before timing out. `0` means no timeout.|`30000`|
|`receiveTimeoutMillis`|`number`|The number of milliseconds to wait for a response the API server before timing out. `0` means no timeout.|`60000`|

### Packaging

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`maven`|`MavenConfig`|Configuration for generating a Maven `pom.xml`|`undefined`|

#### `MavenConfig`

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`groupId`|`string`|The Maven template groupId|`com.example`|
|`artifactId`|`string`|The Maven template artifactId|`api-server`|
|`version`|`string`|The Maven template version|`0.0.1`|
|`versions`|`{ name: version }`|Custom dependency versions (see `pom.hbs`)|`undefined`|

### General

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`hideGenerationTimestamp`|`boolean`|Whether to hide the timestamp in the `@Generated` annotation.|`false`|

### Overrides

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`imports`|`string[]`|Additional imports to add to all generated classes.|`undefined`|
|`customTemplates`|`string`|The path to a directory containing custom Handlebars templates, relative to the config file. See Customising below.|`undefined`|

## Customising

This generator supports a `customTemplates` config file property to specify a directory containing Handlebars templates that will be used to override built-in templates.

Any custom template will have the original template available as a partial named by prefixing the template name with `original`, and then upper-casing the first letter, e.g. `originalBodyParams`.

Some of the templates in the generator are designed to support overriding for custom requirements. Please inspect the templates in the `templates` directory.
