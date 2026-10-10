# @openapi-generator-plus/java-retrofit-client-generator

## 4.0.1

### Patch Changes

- Updated dependencies [3e1cf09]
  - @openapi-generator-plus/generator-common@1.9.1
  - @openapi-generator-plus/java-jaxrs-generator-common@4.1.1
  - @openapi-generator-plus/template-utils@0.3.1

## 4.0.0

### Major Changes

- 9eac57d: Generate a Retrofit project that compiles.

  The generator emitted its own Retrofit interface, and the whole JAX-RS client alongside it:
  the JAX-RS interface, its implementation, the invoker, the providers, the parameter classes
  and the exceptions. Its `pom.xml` declares no JAX-RS implementation, so none of that
  compiled. The generated project could not be built at all.

  The generator now emits only what a Retrofit project uses: its own interface, the models,
  the support classes and `ApiConstants`.

  The `pom.xml` gains the pieces the remaining code needs, and loses one it does not. It now
  declares `swagger-annotations`, which the models carry, and the annotation packages that
  Java 11 removed from the JDK. It declares Retrofit's own Jackson converter in place of the
  JAX-RS Jackson provider, which had nothing to register with.

  **Breaking:** a generated project no longer holds the JAX-RS classes. Use java-cxf-client for a
  JAX-RS client.

### Minor Changes

- e95a3b6: Send an `Accept` header for each operation. The header lists the media types of the operation's default response.

  The generator does not filter that list by what the client can parse. Retrofit parses responses with a converter factory that you supply, so the generator cannot know which media types succeed.

  Retrofit adds header parameters instead of replacing them. So the generator omits the header when the spec declares an `Accept` header parameter. The caller then controls the value. To set a default that a caller can override, add an OkHttp interceptor to your own `Retrofit` client.

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

### Patch Changes

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

- 31ffad5: Send a Retrofit request to the operation's own path, under the names that the API declares.

  The generated `@GET`/`@POST` annotation carried the operation's path within its own group, not
  the whole path. An operation at `/query/scalars` was annotated `/arrays`, so every request in a
  grouped API reached the wrong resource. The annotation now carries the whole path.

  The path is now relative, with no leading "/". Retrofit resolves a path that starts with "/"
  against the root of the host, which discards any path that the base URL carries. A base URL
  such as `https://example.com/api/v1/` now reaches the operation. Retrofit itself requires the
  base URL to end with "/".

  A parameter annotation now carries the name that the API declares, not the name that the
  generator made safe to use in Java. A header named `X-Text` was sent as `xText`, and a path
  parameter whose name needed escaping no longer matched its own placeholder.

  A form parameter is now annotated `@Field`, and its operation `@FormUrlEncoded`. It was
  annotated `@FormUrlEncoded`, which is a method annotation that takes no value, so an API that
  declared one did not compile.

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
  - @openapi-generator-plus/generator-common@1.9.0
  - @openapi-generator-plus/java-jaxrs-generator-common@4.1.0
  - @openapi-generator-plus/template-utils@0.3.0

## 3.0.0

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

  Fixes:

  - java-retrofit-client: the generator works again (its `pom.hbs` had an
    unclosed block and `api.hbs` failed for operations without nested schemas);
    parameters that Retrofit has no annotation for (cookies) are omitted instead
    of leaving stray `,` separators; the pom's `<configuration>` open tag is
    well-formed and `lombok.version` is declared when `useLombok` is set.

### Patch Changes

- Updated dependencies [ea76fa7]
- Updated dependencies
  - @openapi-generator-plus/generator-common@1.8.1
  - @openapi-generator-plus/template-utils@0.2.0
  - @openapi-generator-plus/java-jaxrs-generator-common@4.0.0
  - @openapi-generator-plus/java-jaxrs-client-generator@5.0.0

## 2.7.5

### Patch Changes

- @openapi-generator-plus/handlebars-templates@1.12.2
- @openapi-generator-plus/java-jaxrs-client-generator@4.2.5

## 2.7.4

### Patch Changes

- @openapi-generator-plus/handlebars-templates@1.12.1
- @openapi-generator-plus/java-jaxrs-client-generator@4.2.4

## 2.7.3

### Patch Changes

- Updated dependencies [c9a78e6]
  - @openapi-generator-plus/handlebars-templates@1.12.0
  - @openapi-generator-plus/java-jaxrs-client-generator@4.2.3

## 2.7.2

### Patch Changes

- Updated dependencies [6b6eaa4]
  - @openapi-generator-plus/java-jaxrs-client-generator@4.2.2
  - @openapi-generator-plus/handlebars-templates@1.11.6

## 2.7.1

### Patch Changes

- @openapi-generator-plus/java-jaxrs-client-generator@4.2.1

## 2.7.0

### Patch Changes

- @openapi-generator-plus/java-jaxrs-client-generator@4.2.0

## 2.6.14

### Patch Changes

- Updated dependencies [1b10743]
- Updated dependencies [b9df74f]
  - @openapi-generator-plus/java-jaxrs-client-generator@4.1.1

## 2.6.13

### Patch Changes

- c46a686: Update core for inclusion of parameter encoding in native type functions
- d59c6fd: Update core
- Updated dependencies [c46a686]
- Updated dependencies [cc6d41d]
- Updated dependencies [d59c6fd]
  - @openapi-generator-plus/handlebars-templates@1.11.5
  - @openapi-generator-plus/java-jaxrs-client-generator@4.1.0

## 2.6.12

### Patch Changes

- 2ac8a50: Update dependencies including core
- Updated dependencies [2ac8a50]
  - @openapi-generator-plus/handlebars-templates@1.11.4
  - @openapi-generator-plus/java-jaxrs-client-generator@4.0.2

## 2.6.11

### Patch Changes

- @openapi-generator-plus/java-jaxrs-client-generator@4.0.1

## 2.6.10

### Patch Changes

- 0be9479: Upgrade Lombok and Maven configuration to support compiling with JDK >= 23
- Updated dependencies [60d79d5]
- Updated dependencies [0be9479]
  - @openapi-generator-plus/java-jaxrs-client-generator@4.0.0

## 2.6.9

### Patch Changes

- @openapi-generator-plus/java-jaxrs-client-generator@3.3.3

## 2.6.8

### Patch Changes

- Updated dependencies [09db6b3]
  - @openapi-generator-plus/handlebars-templates@1.11.3
  - @openapi-generator-plus/java-jaxrs-client-generator@3.3.2

## 2.6.7

### Patch Changes

- Updated dependencies [a53f04f]
- Updated dependencies [c8cea0e]
  - @openapi-generator-plus/java-jaxrs-client-generator@3.3.1
  - @openapi-generator-plus/handlebars-templates@1.11.2

## 2.6.6

### Patch Changes

- Updated dependencies [58ccf51]
  - @openapi-generator-plus/java-jaxrs-client-generator@3.3.0

## 2.6.5

### Patch Changes

- @openapi-generator-plus/java-jaxrs-client-generator@3.2.2

## 2.6.4

### Patch Changes

- @openapi-generator-plus/java-jaxrs-client-generator@3.2.1

## 2.6.3

### Patch Changes

- 601553e: Update core
- Updated dependencies [366ada5]
- Updated dependencies [601553e]
  - @openapi-generator-plus/java-jaxrs-client-generator@3.2.0
  - @openapi-generator-plus/handlebars-templates@1.11.1

## 2.6.2

### Patch Changes

- Updated dependencies [8c59015]
  - @openapi-generator-plus/handlebars-templates@1.11.0
  - @openapi-generator-plus/java-jaxrs-client-generator@3.1.2

## 2.6.1

### Patch Changes

- Updated dependencies [8b4824a]
  - @openapi-generator-plus/handlebars-templates@1.10.0
  - @openapi-generator-plus/java-jaxrs-client-generator@3.1.1

## 2.6.0

### Minor Changes

- 382b02c: Bump core version and now explicitly depend upon core

### Patch Changes

- Updated dependencies [382b02c]
  - @openapi-generator-plus/handlebars-templates@1.9.0
  - @openapi-generator-plus/java-jaxrs-client-generator@3.1.0

## 2.5.2

### Patch Changes

- @openapi-generator-plus/java-jaxrs-client-generator@3.0.2

## 2.5.1

### Patch Changes

- @openapi-generator-plus/java-jaxrs-client-generator@3.0.1
- @openapi-generator-plus/handlebars-templates@1.8.1

## 2.5.0

### Minor Changes

- 5b78af2: Upgrade core

### Patch Changes

- Updated dependencies [3436fa2]
- Updated dependencies [e52907f]
- Updated dependencies [f5080b5]
- Updated dependencies [dfae89b]
- Updated dependencies [50f5d88]
- Updated dependencies [f9ba44d]
- Updated dependencies [820892f]
- Updated dependencies [5b78af2]
- Updated dependencies [d9caaab]
- Updated dependencies [e1d7fa3]
- Updated dependencies [976d656]
- Updated dependencies [1e8f5da]
  - @openapi-generator-plus/java-jaxrs-client-generator@3.0.0
  - @openapi-generator-plus/handlebars-templates@1.8.0

## 2.4.0

### Minor Changes

- 9e1dc23: Update upstream

### Patch Changes

- Updated dependencies [9e1dc23]
  - @openapi-generator-plus/handlebars-templates@1.7.0
  - @openapi-generator-plus/java-jaxrs-client-generator@2.4.0

## 2.3.3

### Patch Changes

- Updated dependencies [4b9c50f]
  - @openapi-generator-plus/handlebars-templates@1.6.0
  - @openapi-generator-plus/java-jaxrs-client-generator@2.3.3

## 2.3.2

### Patch Changes

- Updated dependencies [df4a78f]
  - @openapi-generator-plus/handlebars-templates@1.5.1
  - @openapi-generator-plus/java-jaxrs-client-generator@2.3.2

## 2.3.1

### Patch Changes

- 506c9be: Use pnpm 9 and workspace uris
- 2f86851: Update openapi-generator-plus upstream
- Updated dependencies [506c9be]
- Updated dependencies [18ff6da]
- Updated dependencies [a5c7d64]
- Updated dependencies [6d43eca]
- Updated dependencies [5790781]
- Updated dependencies [2f86851]
  - @openapi-generator-plus/handlebars-templates@1.5.0
  - @openapi-generator-plus/java-jaxrs-client-generator@2.3.1

## 2.3.0

### Minor Changes

- 26c8e2bd: Fix handling of catch-all responses

### Patch Changes

- Updated dependencies [26c8e2bd]
  - @openapi-generator-plus/handlebars-templates@1.4.0
  - @openapi-generator-plus/java-jaxrs-client-generator@2.3.0

## 2.2.10

### Patch Changes

- bc8647d6: Update core
- Updated dependencies [bc8647d6]
  - @openapi-generator-plus/handlebars-templates@1.3.5
  - @openapi-generator-plus/java-jaxrs-client-generator@2.2.10

## 2.2.9

### Patch Changes

- 9b87ba44: Update core
- Updated dependencies [9b87ba44]
  - @openapi-generator-plus/handlebars-templates@1.3.4
  - @openapi-generator-plus/java-jaxrs-client-generator@2.2.9

## 2.2.8

### Patch Changes

- cc2bb308: Update core types
- Updated dependencies [cc2bb308]
  - @openapi-generator-plus/handlebars-templates@1.3.3
  - @openapi-generator-plus/java-jaxrs-client-generator@2.2.8

## 2.2.7

### Patch Changes

- 81de680: Update to latest core types
- Updated dependencies [81de680]
  - @openapi-generator-plus/handlebars-templates@1.3.2
  - @openapi-generator-plus/java-jaxrs-client-generator@2.2.7

## 2.2.6

### Patch Changes

- d41da8d: Upgrade core types
- b6d16d9: Update dependencies
- Updated dependencies [d41da8d]
- Updated dependencies [b6d16d9]
- Updated dependencies [1f8b503]
  - @openapi-generator-plus/handlebars-templates@1.3.1
  - @openapi-generator-plus/java-jaxrs-client-generator@2.2.6

## 2.2.5

### Patch Changes

- Updated dependencies [8c9c533]
  - @openapi-generator-plus/handlebars-templates@1.3.0
  - @openapi-generator-plus/java-jaxrs-client-generator@2.2.5

## 2.2.4

### Patch Changes

- @openapi-generator-plus/java-jaxrs-client-generator@2.2.4

## 2.2.3

### Patch Changes

- @openapi-generator-plus/java-jaxrs-client-generator@2.2.3

## 2.2.2

### Patch Changes

- da518bb: Update core types
- Updated dependencies [da518bb]
  - @openapi-generator-plus/handlebars-templates@1.2.4
  - @openapi-generator-plus/java-jaxrs-client-generator@2.2.2

## 2.2.1

### Patch Changes

- @openapi-generator-plus/java-jaxrs-client-generator@2.2.1

## 2.2.0

### Minor Changes

- 2c194dd: Upgrade Jackson to 2.14.2

### Patch Changes

- Updated dependencies [2c194dd]
  - @openapi-generator-plus/java-jaxrs-client-generator@2.2.0

## 2.1.4

### Patch Changes

- Updated dependencies [5601ab5]
  - @openapi-generator-plus/handlebars-templates@1.2.3
  - @openapi-generator-plus/java-jaxrs-client-generator@2.1.4

## 2.1.3

### Patch Changes

- 9732cd1: Update core to 2.3.0
- Updated dependencies [9732cd1]
  - @openapi-generator-plus/handlebars-templates@1.2.2
  - @openapi-generator-plus/java-jaxrs-client-generator@2.1.3

## 2.1.2

### Patch Changes

- Updated dependencies [d2d2faa]
  - @openapi-generator-plus/java-jaxrs-client-generator@2.1.2

## 2.1.1

### Patch Changes

- 691f556: Update core to 2.2.0
- Updated dependencies [691f556]
  - @openapi-generator-plus/handlebars-templates@1.2.1
  - @openapi-generator-plus/java-jaxrs-client-generator@2.1.1

## 2.1.0

### Minor Changes

- db48add: Upgrade core types to 2.1.0 to return the `initialValue` function removed incorrectly in 2.0.0

### Patch Changes

- Updated dependencies [db48add]
  - @openapi-generator-plus/handlebars-templates@1.2.0
  - @openapi-generator-plus/java-jaxrs-client-generator@2.1.0

## 2.0.0

### Major Changes

- 19a8994: Update @openapi-generator-plus/core to 2.0.0

  _Note_ Please check the changelog for Java generators for breaking changes to the default values in generated model classes.

### Patch Changes

- Updated dependencies [19a8994]
  - @openapi-generator-plus/java-jaxrs-client-generator@2.0.0
  - @openapi-generator-plus/handlebars-templates@1.1.4

## 1.1.1

### Patch Changes

- Updated dependencies [072fe50]
  - @openapi-generator-plus/handlebars-templates@1.1.3
  - @openapi-generator-plus/java-jaxrs-client-generator@1.1.1

## 1.1.0

### Minor Changes

- 7167f85: Add support for jakarta namespace using useJakarta config option

### Patch Changes

- Updated dependencies [7167f85]
  - @openapi-generator-plus/java-jaxrs-client-generator@1.1.0

## 1.0.2

### Patch Changes

- 4ea4845: Tidy dependencies on @openapi-generator-plus core modules
- Updated dependencies [4ea4845]
- Updated dependencies [cab735b]
  - @openapi-generator-plus/handlebars-templates@1.1.2
  - @openapi-generator-plus/java-jaxrs-client-generator@1.0.2

## 1.0.1

### Patch Changes

- @openapi-generator-plus/java-jaxrs-client-generator@1.0.1

## 1.0.0

### Major Changes

- 8717cfb: First major release

### Patch Changes

- Updated dependencies [63e4795]
- Updated dependencies [8717cfb]
- Updated dependencies [5f3d600]
  - @openapi-generator-plus/handlebars-templates@1.0.0
  - @openapi-generator-plus/java-jaxrs-client-generator@1.0.0

## 0.30.6

### Patch Changes

- Updated dependencies [23171d5]
  - @openapi-generator-plus/handlebars-templates@0.27.0
  - @openapi-generator-plus/java-jaxrs-client-generator@0.39.7

## 0.30.5

### Patch Changes

- 2e840bb: Standardise on OpenAPI Generator Plus instead of OpenAPI Generator+
- Updated dependencies [2e840bb]
  - @openapi-generator-plus/java-jaxrs-client-generator@0.39.5

## 0.30.4

### Patch Changes

- 28e4e3b: Standardise terminology from generator module to generator template
- Updated dependencies [28e4e3b]
  - @openapi-generator-plus/java-jaxrs-client-generator@0.39.4

## 0.30.3

### Patch Changes

- b45576a: Update package.json metadata to include better homepage URLs
- Updated dependencies [b45576a]
  - @openapi-generator-plus/handlebars-templates@0.26.1
  - @openapi-generator-plus/java-jaxrs-client-generator@0.39.3

## 0.30.2

### Patch Changes

- Updated dependencies [630ba24]
- Updated dependencies [7ccb797]
- Updated dependencies [25a8ab6]
- Updated dependencies [0cfd306]
  - @openapi-generator-plus/handlebars-templates@0.26.0
  - @openapi-generator-plus/java-jaxrs-client-generator@0.39.2

## 0.30.1

### Patch Changes

- Updated dependencies [e72fec6]
- Updated dependencies [ad19364]
- Updated dependencies [a2ae651]
  - @openapi-generator-plus/handlebars-templates@0.25.0
  - @openapi-generator-plus/java-jaxrs-client-generator@0.39.1

## 0.30.0

### Minor Changes

- 10aeb32: Fixes for CodegenRequestBody.nativeType changing to nullable

### Patch Changes

- Updated dependencies [ff4ee4f]
- Updated dependencies [10aeb32]
- Updated dependencies [9c992d5]
  - @openapi-generator-plus/handlebars-templates@0.24.0
  - @openapi-generator-plus/java-jaxrs-client-generator@0.39.0

## 0.29.9

### Patch Changes

- Updated dependencies [26e7810]
- Updated dependencies [135a732]
  - @openapi-generator-plus/handlebars-templates@0.23.0
  - @openapi-generator-plus/java-jaxrs-client-generator@0.38.3

## 0.29.8

### Patch Changes

- Updated dependencies [fa0f593]
  - @openapi-generator-plus/handlebars-templates@0.22.0
  - @openapi-generator-plus/java-jaxrs-client-generator@0.38.2

## 0.29.7

### Patch Changes

- Updated dependencies [b5ad150]
  - @openapi-generator-plus/handlebars-templates@0.21.0
  - @openapi-generator-plus/java-jaxrs-client-generator@0.38.1

## 0.29.6

### Patch Changes

- Updated dependencies [6c1300d]
- Updated dependencies [6c1300d]
  - @openapi-generator-plus/handlebars-templates@0.20.1
  - @openapi-generator-plus/java-jaxrs-client-generator@0.38.0

## 0.29.5

### Patch Changes

- Updated dependencies [b9878c8]
  - @openapi-generator-plus/java-jaxrs-client-generator@0.37.0

## 0.29.4

### Patch Changes

- Updated dependencies [6f81fa5]
- Updated dependencies [c34292b]
  - @openapi-generator-plus/handlebars-templates@0.20.0
  - @openapi-generator-plus/java-jaxrs-client-generator@0.36.3

## 0.29.3

### Patch Changes

- Updated dependencies [7a86b15]
- Updated dependencies [ee03854]
  - @openapi-generator-plus/handlebars-templates@0.19.0
  - @openapi-generator-plus/java-jaxrs-client-generator@0.36.1

## 0.29.2

### Patch Changes

- Updated dependencies [9f6ef06]
  - @openapi-generator-plus/java-jaxrs-client-generator@0.36.0

## 0.29.1

### Patch Changes

- Updated dependencies [a84fd09]
- Updated dependencies [60f75a9]
- Updated dependencies [8ec0d91]
  - @openapi-generator-plus/handlebars-templates@0.18.0
  - @openapi-generator-plus/java-jaxrs-client-generator@0.35.0

## 0.29.0

### Minor Changes

- 86c4e5d: Support the allOf, anyOf, oneOf handling changes in core.

### Patch Changes

- 05d3c03: Changed from lerna to pnpm for monorepo management, and changesets for releases and versioning
- Updated dependencies [05d3c03]
- Updated dependencies [86c4e5d]
  - @openapi-generator-plus/handlebars-templates@0.17.0
  - @openapi-generator-plus/java-jaxrs-client-generator@0.34.0
