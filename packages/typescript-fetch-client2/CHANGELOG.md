# @openapi-generator-plus/typescript-fetch-client-generator2

## 2.1.0

### Minor Changes

- e95a3b6: Send an `Accept` header for each operation. The header lists the media types of the operation's default response. It lists only the media types that the client can parse.

  A caller can override the header.

  The header describes the whole request, not one status code. So it never lists a media type that only an error response declares.

- 6b59c20: Return an undocumented response when a `default` response does not document the content type.

  An operation with a `default` response returned `undefined` when the server sent a content type
  that no response documents. The declared return type did not admit `undefined`.

  A `default` response covers every status code, but only the content types that it documents. So
  `UndocumentedResponse` rejoins the response union for these operations, and the client returns it.
  Handle the extra `'undocumented'` case in a caller that switches on the response status.

- 23723e6: Delete the API files of removed operation groups when you generate with the `--clean` flag.

  The generator emits one file per operation group in the `api` directory. Before this change the clean step did not remove the file of a group that the API specification no longer contains.

  The clean step also removes the `api` directory, if the API has no operation groups.

- 8314ca6: Keep a discriminator property in the schema that declares it

  A schema that declared a discriminator property lost it, when a member of the discriminator took the
  property from that schema. The generated model then had no such property, so a caller could not read
  it from a response, and could not send it in a request, even where the API requires it.

  The core now keeps the property. The model declares it, and a member narrows the property to its own
  value. A member that takes the property from another schema omits it from the extends clause, so that
  it can narrow it.

  A member of discriminators that disagree on its value narrows the property to the union of their
  values, and declares it once. It declared the property once for each discriminator, so the model did
  not compile.

  Closes #48

- 19d2abf: Declare the content type that a specification gives a multipart part.

  An `encoding` with a `contentType` of `application/json` produced a part that declared no
  content type at all. The client appended the JSON as text, so the part arrived as
  `text/plain`. A server that reads a part by its declared type could not parse it.

  The client now attaches the content type to the part.

  A browser `FormData` can only give a part a content type through a `Blob`, and a form
  names every `Blob` `blob`. So a typed part now carries `filename="blob"` as well. A server
  that sorts its parts by the presence of a filename sees this part as a file. The Node
  clients use the `form-data` package, which takes the content type as an option, so their
  parts carry no filename.

  The new `multipartTypedPart` hook renders such a part, so a child generator can attach the
  content type in the way that its own multipart implementation needs.

- 3f090fc: Generate a `tsconfig.json` that sets `strict`.

  The generated `tsconfig.json` set only `noImplicitAny`. So the test suite compiled the generated
  code with `strictNullChecks` off, and it could not find null-safety defects. A consumer who sets
  `strict` found them instead. See https://github.com/karlvr/openapi-generator-plus-generators/issues/59

### Patch Changes

- 446f067: Improve the documentation of the `constantStyle` config option. The documentation now shows the
  result of each style, and explains where the generator uses constant names.
- 77934c2: Read an array response header as its elements.

  A response that declared an array header generated code that did not compile, because the client
  gave the raw header text where the type was an array. The client now splits the header on its
  commas, and on any whitespace around them, and converts each element to its declared type.

- cc34e79: Percent encode a joined parameter value once, not twice.

  A style that joins many values into one, such as a non-exploded array or object, a
  `pipeDelimited` or a `spaceDelimited` parameter, ran each value through `escape` before
  it joined them. The client then gave the joined value to `URLSearchParams` or to
  `Headers`, which encoded the `%` of each escape again.

  So a value with a space arrived as `a%20b`, and a date-time arrived as
  `2020-01-02T03%3A04%3A05.678Z`. A server read the escape as text.

  The client now joins the raw values. The destination encodes them, which it already did.
  A header keeps its value as text, because a header carries no percent encoding.

  `escape` also encodes a character outside Latin-1 as `%uXXXX`, which is not a percent
  encoding at all. That form is gone too.

  OpenAPI does not define how to escape a value that holds the delimiter itself. Such a
  value stays ambiguous, as it was before.

- f4e0291: Fix `Content-Type` header for `multipart/form-data` request bodies.

  We must allow `fetch` to automatically set the `Content-Type` header for `multipart/form-data` request bodies as it includes the `boundary` parameter from the `FormData`.

- c257a41: Serialize a null form property or multipart part as an empty value.

  A nullable request-body property or multipart part was tested only against `undefined` before the
  client read it. A null array or object then reached `.map()` or a property access, and a null date
  reached `dateToString()`. Both throw a TypeError. A null scalar became the text `null`.

  A form encoding carries strings, so it has no null. The client now sends `prop=` for a null value,
  which is what a null object property and a null array element already produced. An absent value
  stays absent. So null and absent stay distinct.

  Two shapes cannot carry an empty value, because they name each property rather than the property
  itself. An exploded object and a `deepObject` are omitted when the object itself is null.

  A multipart part is unchanged where it can encode null. A JSON part still sends `null`, and a text
  part still sends an empty string. A binary part is omitted, because it has no null form.

  A JSON request body is unaffected. It has always sent `null` for a null property.

  A parameter and a header are no longer nullable. The core now ignores the nullability of their
  schemas, and warns, because OpenAPI does not define how to send null in either.

- Updated dependencies [e95a3b6]
- Updated dependencies [23723e6]
- Updated dependencies [446f067]
- Updated dependencies [189ecc2]
- Updated dependencies [c438203]
- Updated dependencies [f4e0291]
- Updated dependencies [3f090fc]
- Updated dependencies [9efc0f6]
  - @openapi-generator-plus/typescript-generator-common@2.1.0
  - @openapi-generator-plus/generator-common@1.9.0
  - @openapi-generator-plus/template-utils@0.3.0

## 2.0.0

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
  - @openapi-generator-plus/typescript-generator-common@2.0.0

## 1.6.2

### Patch Changes

- Updated dependencies [429cf24]
  - @openapi-generator-plus/generator-common@1.8.0
  - @openapi-generator-plus/handlebars-templates@1.12.2
  - @openapi-generator-plus/typescript-generator-common@1.14.2

## 1.6.1

### Patch Changes

- Updated dependencies [8fd8e7c]
  - @openapi-generator-plus/generator-common@1.7.5
  - @openapi-generator-plus/handlebars-templates@1.12.1
  - @openapi-generator-plus/typescript-generator-common@1.14.1

## 1.6.0

### Minor Changes

- 68c0def: Support enum value descriptions

### Patch Changes

- Updated dependencies [c9a78e6]
  - @openapi-generator-plus/handlebars-templates@1.12.0
  - @openapi-generator-plus/typescript-generator-common@1.14.0

## 1.5.2

### Patch Changes

- bffeebd: Fix indentation for multipart form parameters
- d72294a: Add support for customising the generated api namespace
- Updated dependencies [d72294a]
  - @openapi-generator-plus/typescript-generator-common@1.13.2

## 1.5.1

### Patch Changes

- 4f5319c: Fix handling of non-string header schemas
- Updated dependencies [337b525]
  - @openapi-generator-plus/generator-common@1.7.4
  - @openapi-generator-plus/handlebars-templates@1.11.6
  - @openapi-generator-plus/typescript-generator-common@1.13.1

## 1.5.0

### Minor Changes

- bd10b69: Add UnauthorizedResponse for methods that declare security
- 3d8aa21: Don't add UndocumentedResponse to API response types if there is a catch-all response

### Patch Changes

- e911237: Replace String.replaceAll usage with String.split.join to avoid issue with JavaScript versions

## 1.4.0

### Minor Changes

- ca74da4: Add support for ESM-style code generation and fix imports of types when TypeScript option `verbatimModuleSyntax` is on
- 7417c3a: Add support for unique discriminators upstream change

### Patch Changes

- 324111c: Add missing newline on the end of index.hbs
- c46a686: Update core for inclusion of parameter encoding in native type functions
- 9bfe758: Fix types to support TypeScript `exactOptionalPropertyTypes` option
- 81f6c9b: Add support for adding imports to index.ts
- d59c6fd: Update core
- Updated dependencies [ca74da4]
- Updated dependencies [c46a686]
- Updated dependencies [d59c6fd]
  - @openapi-generator-plus/typescript-generator-common@1.13.0
  - @openapi-generator-plus/handlebars-templates@1.11.5
  - @openapi-generator-plus/generator-common@1.7.3

## 1.3.2

### Patch Changes

- 2ac8a50: Update dependencies including core
- Updated dependencies [2ac8a50]
  - @openapi-generator-plus/handlebars-templates@1.11.4
  - @openapi-generator-plus/typescript-generator-common@1.12.3
  - @openapi-generator-plus/generator-common@1.7.2

## 1.3.1

### Patch Changes

- 8fb539c: Upgrade TypeScript (5.9.2) and Node types (20.14.8)
- 9ecaf05: Fix dateToString declaration always returning undefined
- Updated dependencies [09db6b3]
  - @openapi-generator-plus/handlebars-templates@1.11.3
  - @openapi-generator-plus/typescript-generator-common@1.12.2

## 1.3.0

### Minor Changes

- e8773a6: Fix headers on response types without bodies to always be optional
- 04bbc2c: Fix typing on `defaultFetch` to remove undefined

### Patch Changes

- f2c671a: Fix not using property serialized names in multipart requests

## 1.2.0

### Minor Changes

- cc32952: Try to autodetect default `fetch` rather than assuming a browser environment

### Patch Changes

- 3a2572c: Fix Failed to execute 'fetch' on 'Window': Illegal invocation

## 1.1.1

### Patch Changes

- baa60c0: Re-export named types using type keyword.

## 1.1.0

### Minor Changes

- aa2a087: Never throw errors from the generated API endpoints. Instead, these are handled using two new
  response status types: `'error'` and `'undocumented'`.

## 1.0.2

### Patch Changes

- e4a7a96: Add missing configuration parameter JSDoc

## 1.0.1

### Patch Changes

- Updated dependencies [c8cea0e]
  - @openapi-generator-plus/handlebars-templates@1.11.2
  - @openapi-generator-plus/typescript-generator-common@1.12.1

## 1.0.0

### Major Changes

- 964c0bc: Divide the API into different files for each group and removed the classes in favour of exposing the endpoint functions directly. The equivalent of creating a new class instance of the API is using the `withConfiguration(...)` function from each API file. Alternatively, the configuration can be set globally using `setDefaultConfiguration`. By default, it uses `defaultFetch` and the `BASE_URI` from the API specification (if there's only one server).

## 0.12.0

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
  - @openapi-generator-plus/typescript-generator-common@1.12.0
  - @openapi-generator-plus/handlebars-templates@1.11.1
  - @openapi-generator-plus/generator-common@1.7.1

## 0.11.2

### Patch Changes

- Updated dependencies [8c59015]
  - @openapi-generator-plus/handlebars-templates@1.11.0
  - @openapi-generator-plus/typescript-generator-common@1.11.2

## 0.11.1

### Patch Changes

- Updated dependencies [8b4824a]
  - @openapi-generator-plus/handlebars-templates@1.10.0
  - @openapi-generator-plus/typescript-generator-common@1.11.1

## 0.11.0

### Minor Changes

- 382b02c: Bump core version and now explicitly depend upon core

### Patch Changes

- Updated dependencies [382b02c]
  - @openapi-generator-plus/handlebars-templates@1.9.0
  - @openapi-generator-plus/typescript-generator-common@1.11.0
  - @openapi-generator-plus/generator-common@1.7.0

## 0.10.1

### Patch Changes

- Updated dependencies [2685ee7]
  - @openapi-generator-plus/generator-common@1.6.1
  - @openapi-generator-plus/handlebars-templates@1.8.1
  - @openapi-generator-plus/typescript-generator-common@1.10.1

## 0.10.0

### Minor Changes

- 5b78af2: Upgrade core

### Patch Changes

- Updated dependencies [e52907f]
- Updated dependencies [f5080b5]
- Updated dependencies [dfae89b]
- Updated dependencies [50f5d88]
- Updated dependencies [820892f]
- Updated dependencies [5b78af2]
- Updated dependencies [e1d7fa3]
- Updated dependencies [976d656]
  - @openapi-generator-plus/handlebars-templates@1.8.0
  - @openapi-generator-plus/typescript-generator-common@1.10.0
  - @openapi-generator-plus/generator-common@1.6.0

## 0.9.0

### Minor Changes

- 9e1dc23: Update upstream

### Patch Changes

- Updated dependencies [9e1dc23]
- Updated dependencies [3363813]
  - @openapi-generator-plus/handlebars-templates@1.7.0
  - @openapi-generator-plus/typescript-generator-common@1.9.0
  - @openapi-generator-plus/generator-common@1.5.0

## 0.8.2

### Patch Changes

- Updated dependencies [4b9c50f]
  - @openapi-generator-plus/handlebars-templates@1.6.0
  - @openapi-generator-plus/typescript-generator-common@1.8.2

## 0.8.1

### Patch Changes

- Updated dependencies [df4a78f]
  - @openapi-generator-plus/handlebars-templates@1.5.1
  - @openapi-generator-plus/typescript-generator-common@1.8.1

## 0.8.0

### Minor Changes

- 18ff6da: Support new FILE schema type

### Patch Changes

- 506c9be: Use pnpm 9 and workspace uris
- a5c7d64: Update templates for changes to multipart file properties to no longer contain metadata generated in core. If we want to bring back metadata in a generator template we'll need to add a specific FILE type to store that.
- 5790781: Add CodegenContent type checking Handlebars helpers
- 2f86851: Update openapi-generator-plus upstream
- Updated dependencies [506c9be]
- Updated dependencies [18ff6da]
- Updated dependencies [5c51b1d]
- Updated dependencies [a5c7d64]
- Updated dependencies [6d43eca]
- Updated dependencies [5790781]
- Updated dependencies [2f86851]
  - @openapi-generator-plus/handlebars-templates@1.5.0
  - @openapi-generator-plus/typescript-generator-common@1.8.0
  - @openapi-generator-plus/generator-common@1.4.1

## 0.7.1

### Patch Changes

- Updated dependencies [b8188524]
  - @openapi-generator-plus/typescript-generator-common@1.7.1

## 0.7.0

### Minor Changes

- 26c8e2bd: Fix handling of catch-all responses

### Patch Changes

- Updated dependencies [26c8e2bd]
  - @openapi-generator-plus/handlebars-templates@1.4.0
  - @openapi-generator-plus/typescript-generator-common@1.7.0
  - @openapi-generator-plus/generator-common@1.4.0

## 0.6.6

### Patch Changes

- bc8647d6: Update core
- Updated dependencies [bc8647d6]
  - @openapi-generator-plus/handlebars-templates@1.3.5
  - @openapi-generator-plus/typescript-generator-common@1.6.5
  - @openapi-generator-plus/generator-common@1.3.9

## 0.6.5

### Patch Changes

- 9b87ba44: Update core
- Updated dependencies [9b87ba44]
  - @openapi-generator-plus/handlebars-templates@1.3.4
  - @openapi-generator-plus/typescript-generator-common@1.6.4
  - @openapi-generator-plus/generator-common@1.3.8

## 0.6.4

### Patch Changes

- cc2bb308: Update core types
- Updated dependencies [cc2bb308]
  - @openapi-generator-plus/handlebars-templates@1.3.3
  - @openapi-generator-plus/typescript-generator-common@1.6.3
  - @openapi-generator-plus/generator-common@1.3.7

## 0.6.3

### Patch Changes

- 81de680: Update to latest core types
- Updated dependencies [81de680]
  - @openapi-generator-plus/handlebars-templates@1.3.2
  - @openapi-generator-plus/typescript-generator-common@1.6.2
  - @openapi-generator-plus/generator-common@1.3.6

## 0.6.2

### Patch Changes

- d41da8d: Upgrade core types
- b6d16d9: Update dependencies
- Updated dependencies [d41da8d]
- Updated dependencies [b6d16d9]
- Updated dependencies [1f8b503]
  - @openapi-generator-plus/handlebars-templates@1.3.1
  - @openapi-generator-plus/typescript-generator-common@1.6.1
  - @openapi-generator-plus/generator-common@1.3.5

## 0.6.1

### Patch Changes

- Updated dependencies [59c2ca9]
- Updated dependencies [8c9c533]
  - @openapi-generator-plus/generator-common@1.3.4
  - @openapi-generator-plus/handlebars-templates@1.3.0
  - @openapi-generator-plus/typescript-generator-common@1.6.0

## 0.6.0

### Minor Changes

- 958a0a8: Bump node dependencies in the package.json in the generator output to workaround lowest version resolution in pnpm 8

### Patch Changes

- Updated dependencies [a5561e1]
  - @openapi-generator-plus/typescript-generator-common@1.5.4

## 0.5.0

### Minor Changes

- 73e5402: Generate enums as disjunctions, but retain a supporting enum

### Patch Changes

- da518bb: Update core types
- Updated dependencies [da518bb]
  - @openapi-generator-plus/handlebars-templates@1.2.4
  - @openapi-generator-plus/typescript-generator-common@1.5.3
  - @openapi-generator-plus/generator-common@1.3.3

## 0.4.0

### Minor Changes

- 06429d6: Rename automatically generated parameters interface from `EndpointRequest` to `EndpointParameters`

  This is to better represent its purpose; to encapsulate endpoint _parameters_ and so as not to be
  confused with the interfaces we might automatically name for a request body that currently end with
  `Request`.

  This does mean a migration for any existing code with endpoints that have more than one parameters.
  I have treated this as a minor, rather than major, version bump due to the prerelease nature
  of this generator template.

## 0.3.2

### Patch Changes

- 5601ab5: Support illegal identifiers in model interfaces
- Updated dependencies [5601ab5]
  - @openapi-generator-plus/handlebars-templates@1.2.3
  - @openapi-generator-plus/typescript-generator-common@1.5.2

## 0.3.1

### Patch Changes

- 9732cd1: Update core to 2.3.0
- bd75c7d: Fix whitespace in interface extends
- Updated dependencies [9732cd1]
  - @openapi-generator-plus/generator-common@1.3.2
  - @openapi-generator-plus/handlebars-templates@1.2.2
  - @openapi-generator-plus/typescript-generator-common@1.5.1

## 0.3.0

### Minor Changes

- 7477d77: Change approach for discriminator inheritance incompatibility to use Omit rather than resorting to avoiding inheritance

### Patch Changes

- Updated dependencies [7477d77]
  - @openapi-generator-plus/typescript-generator-common@1.5.0

## 0.2.1

### Patch Changes

- 691f556: Update core to 2.2.0
- Updated dependencies [691f556]
- Updated dependencies [84e4151]
  - @openapi-generator-plus/generator-common@1.3.1
  - @openapi-generator-plus/handlebars-templates@1.2.1
  - @openapi-generator-plus/typescript-generator-common@1.4.0

## 0.2.0

### Minor Changes

- db48add: Upgrade core types to 2.1.0 to return the `initialValue` function removed incorrectly in 2.0.0

### Patch Changes

- Updated dependencies [02405ff]
- Updated dependencies [db48add]
  - @openapi-generator-plus/typescript-generator-common@1.3.0
  - @openapi-generator-plus/generator-common@1.3.0
  - @openapi-generator-plus/handlebars-templates@1.2.0

## 0.1.1

### Patch Changes

- 19a8994: Update @openapi-generator-plus/core to 2.0.0

  _Note_ Please check the changelog for Java generators for breaking changes to the default values in generated model classes.

- Updated dependencies [19a8994]
- Updated dependencies [0664881]
- Updated dependencies [87bd6b5]
  - @openapi-generator-plus/generator-common@1.2.0
  - @openapi-generator-plus/handlebars-templates@1.1.4
  - @openapi-generator-plus/typescript-generator-common@1.2.0

## 0.1.0

### Minor Changes

- 2842518: Add blind-date configuration for date-time implementation type

### Patch Changes

- Updated dependencies [2842518]
- Updated dependencies [072fe50]
  - @openapi-generator-plus/typescript-generator-common@1.1.0
  - @openapi-generator-plus/handlebars-templates@1.1.3

## 0.0.3

### Patch Changes

- 4ea4845: Tidy dependencies on @openapi-generator-plus core modules
- Updated dependencies [4ea4845]
- Updated dependencies [cab735b]
  - @openapi-generator-plus/generator-common@1.1.2
  - @openapi-generator-plus/handlebars-templates@1.1.2
  - @openapi-generator-plus/typescript-generator-common@1.0.2

## 0.0.2

### Patch Changes

- 53b8a63: Fix interface properties' use of `frag/propertyDocumentation`
- Updated dependencies [be034fb]
- Updated dependencies [cb18c75]
  - @openapi-generator-plus/generator-common@1.1.0
  - @openapi-generator-plus/handlebars-templates@1.1.0
