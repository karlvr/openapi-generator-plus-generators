# Java JAX-RS Server API generator for OpenAPI Generator Plus

An [OpenAPI Generator Plus](https://github.com/karlvr/openapi-generator-plus) template for a Java API server using JAX-RS.

## Overview

The generated code has useful features:

* Exceptions are used for non-default responses, such as `400` responses, so you can only return the specified status codes.
* Response Exceptions can have an entity type to return with the error response.
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
|`apiImplPackage`|`string`|Package for API implementation classes.|`"${apiPackage}.impl"`|
|`apiParamsPackage`|`string` \| `null`|Package for API parameter classes.|`"${apiPackage}.params"`|
|`apiServicePackage`|`string`|Package for API service interfaces.|`"${apiPackage}.service"`|
|`apiServiceImplPackage`|`string` \| `null`|Package for API service implementation classes.|`"${apiServicePackage}.impl"`|
|`modelPackage`|`string`|Package for API model classes.|`"${package}.model"`|
|`invokerPackage`|`string` \| `null`|Package for API invoker classes.|`"${package}.app"`|
|`invokerName`|`string` \| `null`|Name for the API application class.|`"RestApplication"`|
|`validationPackage`|`string`|Package for API validation classes.|`"${package}.validation"`|
|`relativeSourceOutputPath`|`string`|The path to output generated source code, relative to the output path.|`./` or `./src/main/java` if `maven` is specified.|
|`relativeApiSourceOutputPath`|`string`|The path to output generated API interface source code, relative to the output path.|`${relativeSourceOutputPath}`|
|`relativeApiImplSourceOutputPath`|`string`|The path to output generated API implementation source code, relative to the output path.|`${relativeSourceOutputPath}`|

### Code style

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`useBeanValidation`|`boolean`|Whether to use bean validation.|`true`|
|`dateImplementation`|`string`|Date type class.|`"java.time.LocalDate"`|
|`timeImplementation`|`string`|Time type class.|`"java.time.LocalTime"`|
|`dateTimeImplementation`|`string`|Date time type class.|`"java.time.OffsetDateTime"`|
|`binaryRepresentation`|`string`|Binary data representation.|`"byte[]"`|
|`constantStyle`|`"allCapsSnake"` \| `"allCaps"` \| `"camelCase"` \| `"pascalCase"`|The style to use for constant naming.|`"allCapsSnake"`|
|`enumMemberStyle`|`"preserve"` \| `"constant"`|The style to use for enum member names: `preserve` _attempts_ to match the enum member name to the literal enum value from the spec; `constant` uses the `constantStyle` rules.|`"constant"`|
|`apiClassPrefix`|`string`|Apply a prefix to all API interface and implementation class names.|`undefined`|
|`modelClassPrefix`|`string`|Apply a prefix to all model class names.|`undefined`|
|`modelClassSuffix`|`string`|Apply a suffix to all model class names.|`undefined`|
|`enumClassPrefix`|`string`|Apply a prefix to all enum class names.|`modelClassPrefix`|
|`enumClassSuffix`|`string`|Apply a suffix to all enum class names.|`modelClassSuffix`|
|`authenticationRequiredAnnotation`|`string`|Annotation to add to API methods that require authentication.|`undefined`|
|`useJakarta`|`boolean`|Whether to use `jakarta` packages instead of `javax` packages.|`false`|

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
|`hideGenerationTimestamp`|`boolean`|Whether to hide the timestamp in the `@Generated` annotation.|`true`|

### Testing

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`includeTests`|`boolean`|Whether to generate test classes.|`false`|
|`junitVersion`|`4` \| `5`|The JUnit version to use.|`5`|

### Overrides

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`imports`|`string[]`|Additional imports to add to all generated classes.|`undefined`|
|`customTemplates`|`string`|The path to a directory containing custom Handlebars templates, relative to the config file. See Customising below.|`undefined`|
|`customizations`|`string: JavaClassCustomizations`|Customizations to apply to generated classes as a map from a fully-qualified class name to a customizations object.|`undefined`|

#### `JavaClassCustomizations`

Cutomizations to apply to the selected Java class.

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`implements`|`string[]`|An array of fully-qualified class names to add to the `implements` of the generated class.|`undefined`|

## Customising

This generator supports a `customTemplates` config file property to specify a directory containing Handlebars templates that will be used to override built-in templates.

Any custom template will have the original template available as a partial named by prefixing the template name with `original`, and then upper-casing the first letter, e.g. `originalBodyParams`.

Some of the templates in the generator are designed to support overriding for custom requirements. Please inspect the templates in the `templates` directory.
