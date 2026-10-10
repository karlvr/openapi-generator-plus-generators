# Java JAX-RS Client API generator for OpenAPI Generator Plus

An [OpenAPI Generator Plus](https://github.com/karlvr/openapi-generator-plus) template for a Java API client using JAX-RS.

## Overview

The generated code has useful features:

* Model objects and enums will be nested in the API service if they are inlined in the specification.

[java-cxf-client-generator](../java-cxf-client) builds on this template. The
[client conformance suite](../client-conformance) runs against that generator rather than this one,
and its [Limitations](../java-cxf-client#limitations) list what the suite records.

## Requests

### What an operation takes as a request body

An operation takes the model of its request body, whatever the media type that the body declares.

A form body and a multipart body each reach the wire in the styles that the API declares, including
the joined, exploded and `deepObject` styles. The client builds the body itself, because JAX-RS
applies none of those styles to a `javax.ws.rs.core.Form`.

```java
api.createItem(new CreateItemRequest()
    .name("a widget")
    .tags(Arrays.asList("new", "sale")));
```

A property that is absent is left out of the body. A property that is null writes an empty value,
because a form body carries text, which has no null. So the two stay apart on the wire.

## Responses

### What an operation returns

An operation returns the body of its default response, which is the response carrying the best
status code that the API documents. It returns `void` when that response declares no content.

An operation whose default response declares headers returns a response class instead. The class
nests in the `Api` interface of the operation's group, under the name `<Operation><Code>`. It has a
getter for the body, when the response declares content, and one for each declared header.

```java
ItemsApi.ListItems200 response = api.listItems();
List<Item> items = response.getBody();
Integer total = response.getXTotalCount();
```

### What an operation throws

An operation throws a generated exception for every response other than its default response,
whatever its status code. So an API that documents both a 200 and a 201 returns the 200 and throws
for the 201. Each exception nests in the `Api` interface, under the name
`<Operation><Code>Exception`. It has a getter for the body and one for each declared header. A
catch-all response uses `Default`, because `default` is the code that the API gives it.

```java
try {
    api.getItem(id);
} catch (ItemsApi.GetItem429Exception e) {
    Integer retryAfter = e.getRetryAfter();
} catch (ItemsApi.GetItem404Exception e) {
    Error body = e.getEntity();
}
```

A status code that no response documents throws `UnexpectedResponseException`, which carries the whole
JAX-RS `Response`. An API that declares a `default` response documents every status code, so its own
exception covers them instead. A body that the client cannot read throws
`UnprocessableResponseException`.

### How the client reads a header

An optional header reads as null when the response did not carry it. A required header that the
response did not carry throws `UnprocessableResponseException`, so a required header is never null.

The client reads each header as text, so it gives a string, a number, a boolean, a date, a time, a
date-time, a UUID, an enum, or an array of one of those. An array separates its elements with
commas, which may have whitespace around them. A value that does not parse as its type throws
`UnprocessableResponseException`.

The client cannot read an object or a URL from a header. It warns at generation time, and leaves
that header null.

## Using

See the [OpenAPI Generator Plus](https://github.com/karlvr/openapi-generator-plus) documentation for how to use
generator templates.

## Config file

The config file is specified on the [command-line](https://github.com/karlvr/openapi-generator-plus/?tab=readme-ov-file#using) when running `openapi-generator-plus` using the `-c <config file>` flag.

The config file is in [YAML](https://yaml.org) format. The config properties below are added to the config file at the top-level.

### Example config

```yml
inputPath: api.yml
outputPath: dist
generator: "@openapi-generator-plus/java-jaxrs-client-generator"

package: com.example
useBeanValidation: true
constantStyle: camelCase
```

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
|`constantStyle`|`"allCapsSnake"` \| `"allCaps"` \| `"camelCase"` \| `"pascalCase"`|The style to use for constant names, i.e. `MY_CONSTANT`, `MYCONSTANT`, `myConstant` or `MyConstant`. Constant names are used for enum member names, if `enumMemberStyle` is `constant`, and for the server URL constants in `ApiConstants`.|`"allCapsSnake"`|
|`enumMemberStyle`|`"preserve"` \| `"constant"`|The style to use for enum member names: `preserve` _attempts_ to match the enum member name to the literal enum value from the spec; `constant` uses the `constantStyle` rules.|`"constant"`|
|`useJakarta`|`boolean`|Whether to use `jakarta` packages instead of `javax` packages.|`false`|
|`useRuntimeUnexpectedExceptions`|`boolean`|Whether to make `UnexpectedApiException` and its various implementations runtime exceptions instead of checked exceptions.|`false`|

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
|`hideGenerationTimestamp`|`boolean`|Whether to hide the timestamp in the `@Generated` annotation.|`true`|

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
