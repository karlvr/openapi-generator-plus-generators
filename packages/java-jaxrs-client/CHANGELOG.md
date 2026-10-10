# @openapi-generator-plus/java-jaxrs-client-generator

## 6.0.0

### Major Changes

- 68802bd: Throw the documented exception for a non-default response that has a 2xx status.

  The client throws for every response other than the default one, whatever its status. But a JAX-RS
  client only throws at 300 and above, so the exception generated for a documented 201 or 204 could
  never be thrown, and that response was reported as if it were the default response.

  Each `ApiSpec` method now returns a JAX-RS `Response`, and the implementation reads the status
  itself. Catch the exceptions that now arrive, and update any code that implements or mocks
  `ApiSpec`.

- ca8ee30: Encode a form request body in the styles that the API declares.

  An operation with an `application/x-www-form-urlencoded` body took a `javax.ws.rs.core.Form`, so the
  caller named every field and encoded every value itself. JAX-RS applies none of the declared styles
  to a `Form`, so no style reached the wire.

  An operation now takes the model of its request body, as it already did for every other media type,
  and the client builds the body. The joined, exploded and `deepObject` styles all reach the wire, and
  a null property writes an empty value rather than being left out. An optional body that the caller
  passes as null sends an empty form.

  The Retrofit client encodes a form body the same way. The encoder lives in the shared package, so
  both clients apply one set of style rules, and both emit a `FormEncoding` support class, which holds
  the rules that turn a value into text.

  A `spaceDelimited` or `pipeDelimited` value that explodes now writes one pair for each part, as
  OpenAPI 3.1 defines. Both clients joined it.

- 68802bd: Give a caller the headers that a response declares.

  An operation whose default response declares headers now returns an `<Operation><Code>` class
  carrying the body and each header, rather than the body alone. Each generated exception now carries
  the headers of its response beside `getEntity()`.

  A required header that is absent, or a header that does not parse as its declared type, makes the
  call throw `UnprocessableResponseException`, as a body that does not parse already does. A list
  header may carry whitespace around its commas. A required header has a primitive type, so it is
  never null.

  This changes the return type of an affected operation, and the constructor of an affected exception.

- f067660: Stop the JAX-RS generators emitting CXF types for a multipart body.

  The JAX-RS client and server rendered a multipart request body with
  `org.apache.cxf.jaxrs.ext.multipart.MultipartBody`, and neither `pom.xml` declared CXF. So a
  generated project did not compile unless its author added CXF themselves, and a project that
  used another JAX-RS implementation could not use the code at all.

  JAX-RS 2.1 declares no multipart API. Each implementation invented its own, so a generator
  that names no implementation cannot express a multipart body. Jakarta REST 3.1 added
  `EntityPart`, which every implementation of that version supplies.

  The JAX-RS generators now render `List<EntityPart>` when the `useJakarta` option is set. Without
  it they refuse to generate a multipart request body, and report why. Use a generator that names
  one implementation for a `javax` project, such as java-cxf-client.

  The CXF generators are unchanged. They now select CXF's multipart API through the new
  `multipartBodyType`, `multipartBodyBuilding` and `multipartBodyParsing` hooks, which
  `cxfMultipartTemplates` supplies. A generator for another implementation can supply its own.

  **Breaking:** generating a multipart request body with java-jaxrs-client or java-jaxrs-server,
  without `useJakarta`, now fails rather than emitting CXF types.

### Minor Changes

- fe2deb5: Send a discriminator value with the type that the spec gives it

  The pojo for a discriminator previously used `@JsonTypeInfo(include = As.PROPERTY)` which Jackson always writes as a JSON string. A spec with another discriminator property type, such as a boolean or an integer, got the wrong type on the wire.

  The pojo now keeps a real field for the discriminator property, and uses
  `@JsonTypeInfo(include = As.EXISTING_PROPERTY, visible = true)`. Jackson reads and writes that field,
  so the value keeps the type that the spec gives it, and a caller can read the value from a pojo.

  A member of a discriminator sets the correct value in its constructor. A member of discriminators
  that disagree on its value sets none, because no one value names it, so the caller sets the value of
  the discriminator that it sends the member through.

  This changes the JSON that a client sends, and that a server answers with, for a discriminator that
  is not a string. The other side of the API may need to accept the correct form as well.

- 51947b1: Report a failure when a response that declares content carries no body.

  The client returned null, so a caller could not tell an empty body from a model whose every property
  was absent. An operation now throws `UnprocessableResponseException`, which carries the response.

- 0a59712: Percent encode a string path parameter.

  The JAX-RS client builds its URI from values that it takes as already encoded. It escapes
  only what a URI cannot carry at all, and a `/` needs no escape there. So a value with a `/`
  added a path segment, and the request reached a different resource. A `?` in a value started
  a query in the same way.

  The generated project now registers a `PathParamConverterProvider`, which percent encodes a
  string path parameter before the client builds the URI. The value then stays inside its own
  segment.

  The provider encodes more than a path segment strictly needs, such as `:` and `@`. A server
  decodes the segment either way, so the value that arrives is the same.

- 6cabb5d: Build the Retrofit client on the shared Java generator, not on the JAX-RS client.

  The Retrofit generator extended `java-jaxrs-client`, which emits a JAX-RS interface, an
  implementation of it, an invoker, providers, parameter classes and exceptions. A Retrofit
  project can use none of those. What it did use was the model layer, which
  `java-jaxrs-generator-common` supplies, and two client templates that `java-jaxrs-client` held.

  The Retrofit generator now extends `java-jaxrs-generator-common` directly, and declares its own
  options, its own emitted files and its own generator type.

  The two templates now belong to `java-jaxrs-generator-common`, where every client in the family
  can reach them. `apiConstants` renders the `ApiConstants` interface, and
  `clientPojoPropertyAnnotations` renders the `@JsonProperty` annotation in the direction that a
  client needs. Neither is emitted by that package, so a server generator is unaffected.

  `formUrlEncodedImplementation` may now return null, which keeps the type that the request
  body's own schema gives. A generator that encodes a form body itself needs that type, because
  it reads each property.

### Patch Changes

- 446f067: Improve the documentation of the `constantStyle` config option. The documentation now shows the
  result of each style, and explains where the generator uses constant names.
- d7c36ad: Declare the annotation packages that the generated code uses.

  Every generated file carries a `@javax.annotation.Generated` annotation, and a model carries
  `@javax.xml.bind.annotation.XmlRootElement`. Java 11 removed both packages from the JDK, and
  the generated `pom.xml` declared neither. So the project did not compile on a current JDK,
  unless another dependency happened to bring them in.

  The `pom.xml` now declares `javax.annotation-api` and `jaxb-api`, as it already did for the
  Jakarta equivalents. Set the `javax_annotation` and `javax_xml_bind` Maven version options to
  choose the versions.

  The java-jaxrs-client suite now compiles a generated project, rather than only rendering it.

- e7289aa: Send a null multipart part in the form that its part type can carry.

  A nullable multipart part gave the attachment a null object when its value was null. CXF
  needs an object to choose a writer, so the whole request failed with a processing
  exception. A caller could not send null for such a part at all.

  Each part type now has its own null form, which matches what the TypeScript clients send. A
  JSON part sends the JSON literal `null`. A text part sends an empty string. A binary part
  has no null form, so the client omits it, and null and absent stay distinct for the parts
  that can tell them apart.

- 9421aaa: Give each multipart part its own name.

  The client built each `multipart/form-data` part with a content disposition that named the
  part, but it gave the attachment no id. CXF takes the name from the id when it writes the
  part, so every part arrived as `Content-Disposition: form-data; name="null"`.

  A server could not tell the parts apart. It saw several parts with the same name, and none
  with the name that the specification declares.

  The client now sets the id as well as the disposition.

- f0d2fd9: Send a form request body and a multipart request body from the Retrofit client.

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

  Each operation declares its own encoding, even for a request model that another operation also
  sends, possibly as JSON. So the `@Body` parameter of an encoded body carries
  `@ApiConverterFactory.Encoding`, which names its operation, and the factory selects the encoder by
  that name. A body without it goes to the next converter factory.

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

- Updated dependencies [446f067]
- Updated dependencies [189ecc2]
- Updated dependencies [850cbdc]
- Updated dependencies [c438203]
- Updated dependencies [fe2deb5]
- Updated dependencies [ca8ee30]
- Updated dependencies [f4e0291]
- Updated dependencies [f067660]
- Updated dependencies [6cabb5d]
- Updated dependencies [f0d2fd9]
  - @openapi-generator-plus/java-like-generator-helper@2.6.8
  - @openapi-generator-plus/generator-common@1.9.0
  - @openapi-generator-plus/java-jaxrs-generator-common@4.1.0
  - @openapi-generator-plus/template-utils@0.3.0

## 5.0.0

### Major Changes

- Replace Handlebars templates with TypeScript templates across every generator.

  Templates are now TypeScript code built on the new
  `@openapi-generator-plus/template-utils` package (the `ts` tagged template with
  SKIP/when/maybe/each/join helpers), giving template development type-safety
  against the codegen document model, ordinary code navigation and refactoring,
  and testability. Generated output is byte-identical to the previous Handlebars
  output (trailing whitespace on a line is no longer emitted), verified across
  every generator's full test-spec corpus during the migration.

  Breaking changes:

  - The `customTemplates` config option is removed. Templates are TypeScript
    code; generators are customized through their typed template and hook APIs
    (for example `FetchClientHooks` in the fetch client generators, the
    `JavaJaxrsTemplates` hook bag in the Java family, and
    `PlainDocumentationHooks` in plain-documentation). Setting `customTemplates`
    now logs a warning and has no effect.
  - The Handlebars-based extension hooks are removed from the shared generator
    contexts: `loadAdditionalTemplates`, `additionalWatchPaths` and
    `additionalExportTemplates` in `typescript-generator-common` and
    `java-jaxrs-generator-common`. Child generators supply typed templates via
    the context `templates` bag and emit extra files via `exportFiles`.
  - The `handlebars` and `@openapi-generator-plus/handlebars-templates`
    dependencies are dropped from all of these packages.

### Patch Changes

- Updated dependencies [ea76fa7]
- Updated dependencies
  - @openapi-generator-plus/generator-common@1.8.1
  - @openapi-generator-plus/template-utils@0.2.0
  - @openapi-generator-plus/java-jaxrs-generator-common@4.0.0
  - @openapi-generator-plus/java-like-generator-helper@2.6.7

## 4.2.5

### Patch Changes

- Updated dependencies [429cf24]
  - @openapi-generator-plus/generator-common@1.8.0
  - @openapi-generator-plus/handlebars-templates@1.12.2
  - @openapi-generator-plus/java-jaxrs-generator-common@3.13.2
  - @openapi-generator-plus/java-like-generator-helper@2.6.6

## 4.2.4

### Patch Changes

- Updated dependencies [8fd8e7c]
  - @openapi-generator-plus/generator-common@1.7.5
  - @openapi-generator-plus/handlebars-templates@1.12.1
  - @openapi-generator-plus/java-jaxrs-generator-common@3.13.1
  - @openapi-generator-plus/java-like-generator-helper@2.6.5

## 4.2.3

### Patch Changes

- Updated dependencies [2756cb1]
- Updated dependencies [79a76ed]
- Updated dependencies [c9a78e6]
- Updated dependencies [68c0def]
  - @openapi-generator-plus/java-jaxrs-generator-common@3.13.0
  - @openapi-generator-plus/handlebars-templates@1.12.0

## 4.2.2

### Patch Changes

- 6b6eaa4: Upgrade Lombok to 1.18.46 in generated pom.xml
- Updated dependencies [337b525]
  - @openapi-generator-plus/generator-common@1.7.4
  - @openapi-generator-plus/handlebars-templates@1.11.6
  - @openapi-generator-plus/java-jaxrs-generator-common@3.12.2
  - @openapi-generator-plus/java-like-generator-helper@2.6.4

## 4.2.1

### Patch Changes

- Updated dependencies [d18497f]
  - @openapi-generator-plus/java-jaxrs-generator-common@3.12.1

## 4.2.0

### Minor Changes

- Updated dependencies [4899c47]
- Updated dependencies [a614773]
  - @openapi-generator-plus/java-jaxrs-generator-common@3.12.0

## 4.1.1

### Patch Changes

- 1b10743: Suppress deprecation warnings on apiImpl methods that call deprecated methods
- b9df74f: Fully qualify @Override annotations
- Updated dependencies [3c820a5]
- Updated dependencies [b9df74f]
  - @openapi-generator-plus/java-jaxrs-generator-common@3.11.1

## 4.1.0

### Minor Changes

- cc6d41d: Add support for form-style parameters using explode === false

### Patch Changes

- c46a686: Update core for inclusion of parameter encoding in native type functions
- d59c6fd: Update core
- Updated dependencies [c46a686]
- Updated dependencies [cc6d41d]
- Updated dependencies [d59c6fd]
  - @openapi-generator-plus/handlebars-templates@1.11.5
  - @openapi-generator-plus/java-jaxrs-generator-common@3.11.0
  - @openapi-generator-plus/generator-common@1.7.3
  - @openapi-generator-plus/java-like-generator-helper@2.6.3

## 4.0.2

### Patch Changes

- 2ac8a50: Update dependencies including core
- Updated dependencies [564a1d4]
- Updated dependencies [2ac8a50]
  - @openapi-generator-plus/java-jaxrs-generator-common@3.10.0
  - @openapi-generator-plus/handlebars-templates@1.11.4
  - @openapi-generator-plus/generator-common@1.7.2
  - @openapi-generator-plus/java-like-generator-helper@2.6.2

## 4.0.1

### Patch Changes

- Updated dependencies [48928f9]
- Updated dependencies [ef18d4f]
  - @openapi-generator-plus/java-jaxrs-generator-common@3.9.1

## 4.0.0

### Major Changes

- 60d79d5: Make `UnexpectedApiException` into a checked `Exception` by default.
  For those who want to use it as a `RuntimeException`, this can be enabled with the `useRuntimeUnexpectedExceptions` config option.

  Additionally, we have reworked `UnexpectedApiException` to be `abstract`.
  Previously `UnexpectedApiException` was acting as both a superclass and a concrete implementation.
  Now it is only a superclass and `UnexpectedApiProcessingException` has taken the role of the concrete implementation.

### Patch Changes

- 0be9479: Upgrade Lombok and Maven configuration to support compiling with JDK >= 23
- Updated dependencies [6576047]
  - @openapi-generator-plus/java-jaxrs-generator-common@3.9.0

## 3.3.3

### Patch Changes

- Updated dependencies [0ff9129]
  - @openapi-generator-plus/java-jaxrs-generator-common@3.8.2

## 3.3.2

### Patch Changes

- 09db6b3: Upgrade dependencies including eslint 9 and updated linting rules
- Updated dependencies [09db6b3]
  - @openapi-generator-plus/handlebars-templates@1.11.3
  - @openapi-generator-plus/java-like-generator-helper@2.6.1
  - @openapi-generator-plus/java-jaxrs-generator-common@3.8.1

## 3.3.1

### Patch Changes

- a53f04f: Update for changes in common relating to server generators
- Updated dependencies [c8cea0e]
- Updated dependencies [34f9531]
  - @openapi-generator-plus/handlebars-templates@1.11.2
  - @openapi-generator-plus/java-jaxrs-generator-common@3.8.0

## 3.3.0

### Minor Changes

- 58ccf51: Overlapping paths on operation groups don't work in Java

### Patch Changes

- Updated dependencies [58ccf51]
  - @openapi-generator-plus/java-jaxrs-generator-common@3.7.0

## 3.2.2

### Patch Changes

- Updated dependencies [d39391e]
- Updated dependencies [14579f3]
- Updated dependencies [1b74cc4]
- Updated dependencies [cb8a924]
  - @openapi-generator-plus/java-jaxrs-generator-common@3.6.0

## 3.2.1

### Patch Changes

- Updated dependencies [a4160fc]
- Updated dependencies [4504739]
  - @openapi-generator-plus/java-jaxrs-generator-common@3.5.1

## 3.2.0

### Minor Changes

- 366ada5: Add `enumMemberStyle` option with new `preserve` option

  The actual naming of the enum members can be really important. We default to the old behaviour, which is to name the enum members according
  to the preferred constant style of the language being generated, but we now add an option to try to preserve the enum member names from the
  API spec. Preserving is important if you use the enum member names in code such as by serializing them or matching them by their string names,
  e.g. Java's `EnumType.valueOf(String)`.

### Patch Changes

- 601553e: Update core
- Updated dependencies [366ada5]
- Updated dependencies [601553e]
  - @openapi-generator-plus/java-jaxrs-generator-common@3.5.0
  - @openapi-generator-plus/java-like-generator-helper@2.6.0
  - @openapi-generator-plus/handlebars-templates@1.11.1
  - @openapi-generator-plus/generator-common@1.7.1

## 3.1.2

### Patch Changes

- Updated dependencies [1b09e3f]
- Updated dependencies [8c59015]
  - @openapi-generator-plus/java-jaxrs-generator-common@3.4.0
  - @openapi-generator-plus/handlebars-templates@1.11.0

## 3.1.1

### Patch Changes

- Updated dependencies [004a933]
- Updated dependencies [8b4824a]
- Updated dependencies [9479c07]
- Updated dependencies [5fa5e01]
  - @openapi-generator-plus/java-jaxrs-generator-common@3.3.0
  - @openapi-generator-plus/handlebars-templates@1.10.0

## 3.1.0

### Minor Changes

- 382b02c: Bump core version and now explicitly depend upon core

### Patch Changes

- Updated dependencies [28ef5ff]
- Updated dependencies [0cddbff]
- Updated dependencies [382b02c]
  - @openapi-generator-plus/java-jaxrs-generator-common@3.2.0
  - @openapi-generator-plus/handlebars-templates@1.9.0
  - @openapi-generator-plus/generator-common@1.7.0
  - @openapi-generator-plus/java-like-generator-helper@2.5.0

## 3.0.2

### Patch Changes

- Updated dependencies [1db8278]
- Updated dependencies [c9a6f07]
  - @openapi-generator-plus/java-jaxrs-generator-common@3.1.0

## 3.0.1

### Patch Changes

- Updated dependencies [2685ee7]
  - @openapi-generator-plus/java-jaxrs-generator-common@3.0.1
  - @openapi-generator-plus/generator-common@1.6.1
  - @openapi-generator-plus/handlebars-templates@1.8.1
  - @openapi-generator-plus/java-like-generator-helper@2.4.1

## 3.0.0

### Major Changes

- d9caaab: Add parameter classes for operations with multiple parameters instead of having lots of method arguments

### Minor Changes

- 3436fa2: Add config options to control the output path for API interfaces vs implementation
- f9ba44d: Add useLombok option for models
- 5b78af2: Upgrade core
- 1e8f5da: Move cleaning of *Api.java and *ApiImpl.java to the package that creates those files

### Patch Changes

- Updated dependencies [3436fa2]
- Updated dependencies [54a632c]
- Updated dependencies [bb413b5]
- Updated dependencies [2515300]
- Updated dependencies [e52907f]
- Updated dependencies [f5080b5]
- Updated dependencies [dfae89b]
- Updated dependencies [50f5d88]
- Updated dependencies [054c84f]
- Updated dependencies [f9ba44d]
- Updated dependencies [024d2a5]
- Updated dependencies [73b6c02]
- Updated dependencies [2bc3447]
- Updated dependencies [a0d6034]
- Updated dependencies [820892f]
- Updated dependencies [5b78af2]
- Updated dependencies [d9caaab]
- Updated dependencies [e1d7fa3]
- Updated dependencies [f092462]
- Updated dependencies [976d656]
- Updated dependencies [bfdfdfa]
- Updated dependencies [1e8f5da]
- Updated dependencies [1fb923c]
  - @openapi-generator-plus/java-jaxrs-generator-common@3.0.0
  - @openapi-generator-plus/handlebars-templates@1.8.0
  - @openapi-generator-plus/java-like-generator-helper@2.4.0
  - @openapi-generator-plus/generator-common@1.6.0

## 2.4.0

### Minor Changes

- 9e1dc23: Update upstream

### Patch Changes

- Updated dependencies [9e1dc23]
- Updated dependencies [3363813]
  - @openapi-generator-plus/handlebars-templates@1.7.0
  - @openapi-generator-plus/java-jaxrs-generator-common@2.9.0
  - @openapi-generator-plus/generator-common@1.5.0
  - @openapi-generator-plus/java-like-generator-helper@2.3.0

## 2.3.3

### Patch Changes

- Updated dependencies [4b9c50f]
  - @openapi-generator-plus/handlebars-templates@1.6.0
  - @openapi-generator-plus/java-jaxrs-generator-common@2.8.2

## 2.3.2

### Patch Changes

- Updated dependencies [df4a78f]
  - @openapi-generator-plus/handlebars-templates@1.5.1
  - @openapi-generator-plus/java-jaxrs-generator-common@2.8.1

## 2.3.1

### Patch Changes

- 506c9be: Use pnpm 9 and workspace uris
- a5c7d64: Update templates for changes to multipart file properties to no longer contain metadata generated in core. If we want to bring back metadata in a generator template we'll need to add a specific FILE type to store that.
- 2f86851: Update openapi-generator-plus upstream
- Updated dependencies [506c9be]
- Updated dependencies [18ff6da]
- Updated dependencies [5c51b1d]
- Updated dependencies [a5c7d64]
- Updated dependencies [6d43eca]
- Updated dependencies [5790781]
- Updated dependencies [2f86851]
  - @openapi-generator-plus/handlebars-templates@1.5.0
  - @openapi-generator-plus/java-jaxrs-generator-common@2.8.0
  - @openapi-generator-plus/java-like-generator-helper@2.2.1
  - @openapi-generator-plus/generator-common@1.4.1

## 2.3.0

### Minor Changes

- 26c8e2bd: Fix handling of catch-all responses

### Patch Changes

- Updated dependencies [26c8e2bd]
  - @openapi-generator-plus/handlebars-templates@1.4.0
  - @openapi-generator-plus/java-jaxrs-generator-common@2.7.0
  - @openapi-generator-plus/generator-common@1.4.0
  - @openapi-generator-plus/java-like-generator-helper@2.2.0

## 2.2.10

### Patch Changes

- bc8647d6: Update core
- Updated dependencies [a1322325]
- Updated dependencies [bc8647d6]
  - @openapi-generator-plus/java-jaxrs-generator-common@2.6.0
  - @openapi-generator-plus/handlebars-templates@1.3.5
  - @openapi-generator-plus/generator-common@1.3.9
  - @openapi-generator-plus/java-like-generator-helper@2.1.10

## 2.2.9

### Patch Changes

- 9b87ba44: Update core
- Updated dependencies [9b87ba44]
  - @openapi-generator-plus/handlebars-templates@1.3.4
  - @openapi-generator-plus/java-jaxrs-generator-common@2.5.4
  - @openapi-generator-plus/generator-common@1.3.8
  - @openapi-generator-plus/java-like-generator-helper@2.1.9

## 2.2.8

### Patch Changes

- cc2bb308: Update core types
- Updated dependencies [cc2bb308]
  - @openapi-generator-plus/handlebars-templates@1.3.3
  - @openapi-generator-plus/java-jaxrs-generator-common@2.5.3
  - @openapi-generator-plus/generator-common@1.3.7
  - @openapi-generator-plus/java-like-generator-helper@2.1.8

## 2.2.7

### Patch Changes

- 81de680: Update to latest core types
- Updated dependencies [81de680]
  - @openapi-generator-plus/handlebars-templates@1.3.2
  - @openapi-generator-plus/java-jaxrs-generator-common@2.5.2
  - @openapi-generator-plus/generator-common@1.3.6
  - @openapi-generator-plus/java-like-generator-helper@2.1.7

## 2.2.6

### Patch Changes

- d41da8d: Upgrade core types
- b6d16d9: Update dependencies
- Updated dependencies [d41da8d]
- Updated dependencies [b6d16d9]
- Updated dependencies [1f8b503]
  - @openapi-generator-plus/handlebars-templates@1.3.1
  - @openapi-generator-plus/java-jaxrs-generator-common@2.5.1
  - @openapi-generator-plus/generator-common@1.3.5
  - @openapi-generator-plus/java-like-generator-helper@2.1.6

## 2.2.5

### Patch Changes

- Updated dependencies [59c2ca9]
- Updated dependencies [1862f39]
- Updated dependencies [8c9c533]
  - @openapi-generator-plus/generator-common@1.3.4
  - @openapi-generator-plus/java-jaxrs-generator-common@2.5.0
  - @openapi-generator-plus/handlebars-templates@1.3.0
  - @openapi-generator-plus/java-like-generator-helper@2.1.5

## 2.2.4

### Patch Changes

- Updated dependencies [899a92d]
  - @openapi-generator-plus/java-jaxrs-generator-common@2.4.0

## 2.2.3

### Patch Changes

- Updated dependencies [03bf3e3]
  - @openapi-generator-plus/java-jaxrs-generator-common@2.3.1

## 2.2.2

### Patch Changes

- da518bb: Update core types
- Updated dependencies [da518bb]
- Updated dependencies [cd474f9]
  - @openapi-generator-plus/handlebars-templates@1.2.4
  - @openapi-generator-plus/java-jaxrs-generator-common@2.3.0
  - @openapi-generator-plus/generator-common@1.3.3
  - @openapi-generator-plus/java-like-generator-helper@2.1.4

## 2.2.1

### Patch Changes

- Updated dependencies [4dff720]
  - @openapi-generator-plus/java-jaxrs-generator-common@2.2.1

## 2.2.0

### Minor Changes

- 2c194dd: Upgrade Jackson to 2.14.2

### Patch Changes

- Updated dependencies [93780ce]
- Updated dependencies [d64090b]
- Updated dependencies [8ec1f52]
  - @openapi-generator-plus/java-jaxrs-generator-common@2.2.0

## 2.1.4

### Patch Changes

- Updated dependencies [5601ab5]
  - @openapi-generator-plus/handlebars-templates@1.2.3
  - @openapi-generator-plus/java-like-generator-helper@2.1.3
  - @openapi-generator-plus/java-jaxrs-generator-common@2.1.4

## 2.1.3

### Patch Changes

- 9732cd1: Update core to 2.3.0
- Updated dependencies [9732cd1]
  - @openapi-generator-plus/generator-common@1.3.2
  - @openapi-generator-plus/handlebars-templates@1.2.2
  - @openapi-generator-plus/java-jaxrs-generator-common@2.1.3
  - @openapi-generator-plus/java-like-generator-helper@2.1.2

## 2.1.2

### Patch Changes

- d2d2faa: java-jaxrs: fix whitespace in front of @QueryParam
- Updated dependencies [d2d2faa]
  - @openapi-generator-plus/java-jaxrs-generator-common@2.1.2

## 2.1.1

### Patch Changes

- 691f556: Update core to 2.2.0
- Updated dependencies [691f556]
  - @openapi-generator-plus/generator-common@1.3.1
  - @openapi-generator-plus/handlebars-templates@1.2.1
  - @openapi-generator-plus/java-jaxrs-generator-common@2.1.1
  - @openapi-generator-plus/java-like-generator-helper@2.1.1

## 2.1.0

### Minor Changes

- db48add: Upgrade core types to 2.1.0 to return the `initialValue` function removed incorrectly in 2.0.0

### Patch Changes

- Updated dependencies [02405ff]
- Updated dependencies [db48add]
- Updated dependencies [02405ff]
  - @openapi-generator-plus/java-jaxrs-generator-common@2.1.0
  - @openapi-generator-plus/generator-common@1.3.0
  - @openapi-generator-plus/handlebars-templates@1.2.0
  - @openapi-generator-plus/java-like-generator-helper@2.1.0

## 2.0.0

### Major Changes

- 19a8994: Update @openapi-generator-plus/core to 2.0.0

  _Note_ Please check the changelog for Java generators for breaking changes to the default values in generated model classes.

### Patch Changes

- Updated dependencies [19a8994]
- Updated dependencies [0664881]
- Updated dependencies [87bd6b5]
  - @openapi-generator-plus/java-jaxrs-generator-common@2.0.0
  - @openapi-generator-plus/java-like-generator-helper@2.0.0
  - @openapi-generator-plus/generator-common@1.2.0
  - @openapi-generator-plus/handlebars-templates@1.1.4

## 1.1.1

### Patch Changes

- Updated dependencies [072fe50]
  - @openapi-generator-plus/handlebars-templates@1.1.3
  - @openapi-generator-plus/java-jaxrs-generator-common@1.3.1

## 1.1.0

### Minor Changes

- 7167f85: Add support for jakarta namespace using useJakarta config option

### Patch Changes

- Updated dependencies [7167f85]
  - @openapi-generator-plus/java-jaxrs-generator-common@1.3.0

## 1.0.2

### Patch Changes

- 4ea4845: Tidy dependencies on @openapi-generator-plus core modules
- Updated dependencies [4ea4845]
- Updated dependencies [cab735b]
  - @openapi-generator-plus/generator-common@1.1.2
  - @openapi-generator-plus/handlebars-templates@1.1.2
  - @openapi-generator-plus/java-jaxrs-generator-common@1.2.2
  - @openapi-generator-plus/java-like-generator-helper@1.0.1

## 1.0.1

### Patch Changes

- Updated dependencies [94f164c]
  - @openapi-generator-plus/java-jaxrs-generator-common@1.2.1

## 1.0.0

### Major Changes

- 8717cfb: First major release

### Patch Changes

- 5f3d600: Fix use of java.util.Optional.isEmpty() for Java < 11
- Updated dependencies [63e4795]
- Updated dependencies [8717cfb]
  - @openapi-generator-plus/generator-common@1.0.0
  - @openapi-generator-plus/handlebars-templates@1.0.0
  - @openapi-generator-plus/java-jaxrs-generator-common@1.0.0
  - @openapi-generator-plus/java-like-generator-helper@1.0.0

## 0.39.9

### Patch Changes

- Updated dependencies [b6297ef]
- Updated dependencies [a16fa0b]
- Updated dependencies [efaea2a]
- Updated dependencies [1109255]
  - @openapi-generator-plus/java-jaxrs-generator-common@0.36.0
  - @openapi-generator-plus/generator-common@0.26.0
  - @openapi-generator-plus/handlebars-templates@0.27.1
  - @openapi-generator-plus/java-like-generator-helper@0.16.4

## 0.39.8

### Patch Changes

- Updated dependencies [f99980e]
  - @openapi-generator-plus/java-jaxrs-generator-common@0.35.0

## 0.39.7

### Patch Changes

- Updated dependencies [23171d5]
  - @openapi-generator-plus/handlebars-templates@0.27.0
  - @openapi-generator-plus/java-jaxrs-generator-common@0.34.1

## 0.39.6

### Patch Changes

- 8558822: Add a config option for the binary data representation to use
- Updated dependencies [8558822]
- Updated dependencies [3592e5a]
- Updated dependencies [0cc86ee]
  - @openapi-generator-plus/java-jaxrs-generator-common@0.34.0

## 0.39.5

### Patch Changes

- 2e840bb: Standardise on OpenAPI Generator Plus instead of OpenAPI Generator+
- Updated dependencies [2e840bb]
  - @openapi-generator-plus/java-jaxrs-generator-common@0.33.5

## 0.39.4

### Patch Changes

- 28e4e3b: Standardise terminology from generator module to generator template
- Updated dependencies [28e4e3b]
  - @openapi-generator-plus/java-jaxrs-generator-common@0.33.4

## 0.39.3

### Patch Changes

- b45576a: Update package.json metadata to include better homepage URLs
- Updated dependencies [51206bb]
- Updated dependencies [b45576a]
  - @openapi-generator-plus/generator-common@0.25.1
  - @openapi-generator-plus/handlebars-templates@0.26.1
  - @openapi-generator-plus/java-jaxrs-generator-common@0.33.3
  - @openapi-generator-plus/java-like-generator-helper@0.16.3

## 0.39.2

### Patch Changes

- 7ccb797: Fix multipart serialization support for nullables
- Updated dependencies [fc32aaf]
- Updated dependencies [630ba24]
- Updated dependencies [e74d3ef]
- Updated dependencies [25a8ab6]
- Updated dependencies [0cfd306]
  - @openapi-generator-plus/java-jaxrs-generator-common@0.33.2
  - @openapi-generator-plus/handlebars-templates@0.26.0
  - @openapi-generator-plus/generator-common@0.25.0
  - @openapi-generator-plus/java-like-generator-helper@0.16.2

## 0.39.1

### Patch Changes

- e72fec6: Fixes for core changes including CodegenSchemaUsage decoupling
- Updated dependencies [e72fec6]
- Updated dependencies [9afa386]
- Updated dependencies [ad19364]
- Updated dependencies [a2ae651]
  - @openapi-generator-plus/handlebars-templates@0.25.0
  - @openapi-generator-plus/java-jaxrs-generator-common@0.33.1
  - @openapi-generator-plus/generator-common@0.24.0
  - @openapi-generator-plus/java-like-generator-helper@0.16.1

## 0.39.0

### Minor Changes

- 10aeb32: Fixes for CodegenRequestBody.nativeType changing to nullable
- 9c992d5: Fixes for CodegenConfig changing to having unknown values

### Patch Changes

- Updated dependencies [60ef5fe]
- Updated dependencies [ff4ee4f]
- Updated dependencies [20967c4]
- Updated dependencies [2f5e239]
- Updated dependencies [10aeb32]
- Updated dependencies [9c992d5]
- Updated dependencies [11b32c0]
  - @openapi-generator-plus/java-like-generator-helper@0.16.0
  - @openapi-generator-plus/handlebars-templates@0.24.0
  - @openapi-generator-plus/java-jaxrs-generator-common@0.33.0
  - @openapi-generator-plus/generator-common@0.23.0

## 0.38.3

### Patch Changes

- Updated dependencies [26e7810]
- Updated dependencies [d4e4122]
- Updated dependencies [135a732]
- Updated dependencies [24823f9]
  - @openapi-generator-plus/handlebars-templates@0.23.0
  - @openapi-generator-plus/java-like-generator-helper@0.15.7
  - @openapi-generator-plus/generator-common@0.22.0
  - @openapi-generator-plus/java-jaxrs-generator-common@0.32.0

## 0.38.2

### Patch Changes

- Updated dependencies [fa0f593]
  - @openapi-generator-plus/generator-common@0.21.0
  - @openapi-generator-plus/handlebars-templates@0.22.0
  - @openapi-generator-plus/java-jaxrs-generator-common@0.31.2
  - @openapi-generator-plus/java-like-generator-helper@0.15.6

## 0.38.1

### Patch Changes

- Updated dependencies [b5ad150]
  - @openapi-generator-plus/generator-common@0.20.0
  - @openapi-generator-plus/handlebars-templates@0.21.0
  - @openapi-generator-plus/java-jaxrs-generator-common@0.31.1
  - @openapi-generator-plus/java-like-generator-helper@0.15.5

## 0.38.0

### Minor Changes

- 6c1300d: Validation enhanced to support asymmetric validation for when a readOnly or writeOnly is present

### Patch Changes

- Updated dependencies [6c1300d]
- Updated dependencies [6c1300d]
  - @openapi-generator-plus/handlebars-templates@0.20.1
  - @openapi-generator-plus/java-jaxrs-generator-common@0.31.0

## 0.37.0

### Minor Changes

- b9878c8: Add support for cookie params

### Patch Changes

- Updated dependencies [b9878c8]
- Updated dependencies [742a47d]
  - @openapi-generator-plus/java-jaxrs-generator-common@0.30.0

## 0.36.3

### Patch Changes

- Updated dependencies [6f81fa5]
- Updated dependencies [c34292b]
  - @openapi-generator-plus/handlebars-templates@0.20.0
  - @openapi-generator-plus/generator-common@0.19.0
  - @openapi-generator-plus/java-jaxrs-generator-common@0.29.1
  - @openapi-generator-plus/java-like-generator-helper@0.15.3

## 0.36.2

### Patch Changes

- 29040b5: Upgrade junit-jupiter from 5.5.2 to 5.7.2 and maven-surefire-plugin to from 3.0.0M4 to 3.0.0M5
- Updated dependencies [48c6e39]
- Updated dependencies [cc30b0d]
  - @openapi-generator-plus/java-jaxrs-generator-common@0.29.0
  - @openapi-generator-plus/handlebars-templates@0.19.1

## 0.36.1

### Patch Changes

- Updated dependencies [7a86b15]
- Updated dependencies [ee03854]
  - @openapi-generator-plus/handlebars-templates@0.19.0
  - @openapi-generator-plus/generator-common@0.18.0
  - @openapi-generator-plus/java-jaxrs-generator-common@0.28.1
  - @openapi-generator-plus/java-like-generator-helper@0.15.2

## 0.36.0

### Minor Changes

- 9f6ef06: Support parameter serializedName and fix more object serializedName cases

## 0.35.0

### Minor Changes

- 8ec0d91: Support externalDocs on operations and pojos, and improve documentation formatting

  We now apply the markdown formatting in all JavaDoc comments. They're supposed to be HTML
  and IDEs expect them to be HTML formatted, so it improves the display in the IDE.

### Patch Changes

- Updated dependencies [a84fd09]
- Updated dependencies [dcd7e17]
- Updated dependencies [04d59a7]
- Updated dependencies [60f75a9]
- Updated dependencies [8ec0d91]
  - @openapi-generator-plus/handlebars-templates@0.18.0
  - @openapi-generator-plus/java-jaxrs-generator-common@0.28.0

## 0.34.1

### Patch Changes

- a65b3ce: Upgrade dependencies
- Updated dependencies [a65b3ce]
- Updated dependencies [0116337]
  - @openapi-generator-plus/generator-common@0.17.1
  - @openapi-generator-plus/handlebars-templates@0.17.1
  - @openapi-generator-plus/java-jaxrs-generator-common@0.27.1
  - @openapi-generator-plus/java-like-generator-helper@0.15.1

## 0.34.0

### Minor Changes

- 86c4e5d: Support the allOf, anyOf, oneOf handling changes in core.

### Patch Changes

- 05d3c03: Changed from lerna to pnpm for monorepo management, and changesets for releases and versioning
- Updated dependencies [05d3c03]
- Updated dependencies [86c4e5d]
  - @openapi-generator-plus/generator-common@0.17.0
  - @openapi-generator-plus/handlebars-templates@0.17.0
  - @openapi-generator-plus/java-jaxrs-generator-common@0.27.0
  - @openapi-generator-plus/java-like-generator-helper@0.15.0
