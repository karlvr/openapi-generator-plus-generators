# @openapi-generator-plus/typescript-fetch-node-client-generator

## 1.1.1

### Patch Changes

- Updated dependencies [3e1cf09]
  - @openapi-generator-plus/generator-common@1.9.1
  - @openapi-generator-plus/template-utils@0.3.1
  - @openapi-generator-plus/typescript-generator-common@2.1.1
  - @openapi-generator-plus/typescript-fetch-client-generator2@2.1.1

## 1.1.0

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
- Updated dependencies [6b59c20]
- Updated dependencies [23723e6]
- Updated dependencies [446f067]
- Updated dependencies [446f067]
- Updated dependencies [189ecc2]
- Updated dependencies [8314ca6]
- Updated dependencies [77934c2]
- Updated dependencies [c438203]
- Updated dependencies [cc34e79]
- Updated dependencies [f4e0291]
- Updated dependencies [19d2abf]
- Updated dependencies [c257a41]
- Updated dependencies [3f090fc]
- Updated dependencies [9efc0f6]
  - @openapi-generator-plus/typescript-generator-common@2.1.0
  - @openapi-generator-plus/typescript-fetch-client-generator2@2.1.0
  - @openapi-generator-plus/generator-common@1.9.0
  - @openapi-generator-plus/template-utils@0.3.0

## 1.0.0

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
  - @openapi-generator-plus/typescript-fetch-client-generator2@2.0.0

## 0.0.7

### Patch Changes

- Updated dependencies [429cf24]
  - @openapi-generator-plus/generator-common@1.8.0
  - @openapi-generator-plus/handlebars-templates@1.12.2
  - @openapi-generator-plus/typescript-generator-common@1.14.2
  - @openapi-generator-plus/typescript-fetch-client-generator2@1.6.2

## 0.0.6

### Patch Changes

- Updated dependencies [8fd8e7c]
  - @openapi-generator-plus/generator-common@1.7.5
  - @openapi-generator-plus/handlebars-templates@1.12.1
  - @openapi-generator-plus/typescript-generator-common@1.14.1
  - @openapi-generator-plus/typescript-fetch-client-generator2@1.6.1

## 0.0.5

### Patch Changes

- Updated dependencies [c9a78e6]
- Updated dependencies [68c0def]
  - @openapi-generator-plus/handlebars-templates@1.12.0
  - @openapi-generator-plus/typescript-generator-common@1.14.0
  - @openapi-generator-plus/typescript-fetch-client-generator2@1.6.0

## 0.0.4

### Patch Changes

- Updated dependencies [bffeebd]
- Updated dependencies [d72294a]
  - @openapi-generator-plus/typescript-fetch-client-generator2@1.5.2
  - @openapi-generator-plus/typescript-generator-common@1.13.2

## 0.0.3

### Patch Changes

- 4f5319c: Fix handling of non-string header schemas
- Updated dependencies [337b525]
- Updated dependencies [4f5319c]
  - @openapi-generator-plus/generator-common@1.7.4
  - @openapi-generator-plus/typescript-fetch-client-generator2@1.5.1
  - @openapi-generator-plus/handlebars-templates@1.11.6
  - @openapi-generator-plus/typescript-generator-common@1.13.1

## 0.0.2

### Patch Changes

- Updated dependencies [e911237]
- Updated dependencies [bd10b69]
- Updated dependencies [3d8aa21]
  - @openapi-generator-plus/typescript-fetch-client-generator2@1.5.0

## 0.0.1

### Patch Changes

- c46a686: Update core for inclusion of parameter encoding in native type functions
- 688f89b: Initial implementation
- d59c6fd: Update core
- Updated dependencies [324111c]
- Updated dependencies [ca74da4]
- Updated dependencies [c46a686]
- Updated dependencies [9bfe758]
- Updated dependencies [7417c3a]
- Updated dependencies [81f6c9b]
- Updated dependencies [d59c6fd]
  - @openapi-generator-plus/typescript-fetch-client-generator2@1.4.0
  - @openapi-generator-plus/typescript-generator-common@1.13.0
  - @openapi-generator-plus/handlebars-templates@1.11.5
  - @openapi-generator-plus/generator-common@1.7.3

## 1.9.2

### Patch Changes

- 2ac8a50: Update dependencies including core
- Updated dependencies [2ac8a50]
  - @openapi-generator-plus/typescript-fetch-client-generator@1.14.2
  - @openapi-generator-plus/handlebars-templates@1.11.4
  - @openapi-generator-plus/typescript-generator-common@1.12.3
  - @openapi-generator-plus/generator-common@1.7.2

## 1.9.1

### Patch Changes

- Updated dependencies [09db6b3]
- Updated dependencies [8fb539c]
- Updated dependencies [9ecaf05]
  - @openapi-generator-plus/handlebars-templates@1.11.3
  - @openapi-generator-plus/typescript-fetch-client-generator@1.14.1
  - @openapi-generator-plus/typescript-generator-common@1.12.2

## 1.9.0

### Minor Changes

- 04bbc2c: Fix typing on `defaultFetch` to remove undefined

### Patch Changes

- Updated dependencies [f2c671a]
- Updated dependencies [04bbc2c]
  - @openapi-generator-plus/typescript-fetch-client-generator@1.14.0

## 1.8.3

### Patch Changes

- Updated dependencies [3a2572c]
- Updated dependencies [cc32952]
  - @openapi-generator-plus/typescript-fetch-client-generator@1.13.0

## 1.8.2

### Patch Changes

- Updated dependencies [c8cea0e]
  - @openapi-generator-plus/handlebars-templates@1.11.2
  - @openapi-generator-plus/typescript-generator-common@1.12.1
  - @openapi-generator-plus/typescript-fetch-client-generator@1.12.1

## 1.8.1

### Patch Changes

- Updated dependencies [f97a924]
  - @openapi-generator-plus/typescript-fetch-client-generator@1.12.0

## 1.8.0

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
  - @openapi-generator-plus/typescript-fetch-client-generator@1.11.0
  - @openapi-generator-plus/typescript-generator-common@1.12.0
  - @openapi-generator-plus/handlebars-templates@1.11.1
  - @openapi-generator-plus/generator-common@1.7.1

## 1.7.2

### Patch Changes

- Updated dependencies [8c59015]
  - @openapi-generator-plus/handlebars-templates@1.11.0
  - @openapi-generator-plus/typescript-generator-common@1.11.2
  - @openapi-generator-plus/typescript-fetch-client-generator@1.10.2

## 1.7.1

### Patch Changes

- Updated dependencies [8b4824a]
  - @openapi-generator-plus/handlebars-templates@1.10.0
  - @openapi-generator-plus/typescript-generator-common@1.11.1
  - @openapi-generator-plus/typescript-fetch-client-generator@1.10.1

## 1.7.0

### Minor Changes

- 382b02c: Bump core version and now explicitly depend upon core

### Patch Changes

- Updated dependencies [382b02c]
  - @openapi-generator-plus/typescript-fetch-client-generator@1.10.0
  - @openapi-generator-plus/handlebars-templates@1.9.0
  - @openapi-generator-plus/typescript-generator-common@1.11.0
  - @openapi-generator-plus/generator-common@1.7.0

## 1.6.1

### Patch Changes

- Updated dependencies [2685ee7]
  - @openapi-generator-plus/generator-common@1.6.1
  - @openapi-generator-plus/handlebars-templates@1.8.1
  - @openapi-generator-plus/typescript-generator-common@1.10.1
  - @openapi-generator-plus/typescript-fetch-client-generator@1.9.1

## 1.6.0

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
  - @openapi-generator-plus/typescript-fetch-client-generator@1.9.0
  - @openapi-generator-plus/typescript-generator-common@1.10.0
  - @openapi-generator-plus/generator-common@1.6.0

## 1.5.0

### Minor Changes

- 9e1dc23: Update upstream

### Patch Changes

- Updated dependencies [9e1dc23]
- Updated dependencies [3363813]
  - @openapi-generator-plus/typescript-fetch-client-generator@1.8.0
  - @openapi-generator-plus/handlebars-templates@1.7.0
  - @openapi-generator-plus/typescript-generator-common@1.9.0
  - @openapi-generator-plus/generator-common@1.5.0

## 1.4.2

### Patch Changes

- Updated dependencies [4b9c50f]
  - @openapi-generator-plus/handlebars-templates@1.6.0
  - @openapi-generator-plus/typescript-generator-common@1.8.2
  - @openapi-generator-plus/typescript-fetch-client-generator@1.7.2

## 1.4.1

### Patch Changes

- Updated dependencies [df4a78f]
  - @openapi-generator-plus/handlebars-templates@1.5.1
  - @openapi-generator-plus/typescript-generator-common@1.8.1
  - @openapi-generator-plus/typescript-fetch-client-generator@1.7.1

## 1.4.0

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
  - @openapi-generator-plus/typescript-fetch-client-generator@1.7.0
  - @openapi-generator-plus/handlebars-templates@1.5.0
  - @openapi-generator-plus/typescript-generator-common@1.8.0
  - @openapi-generator-plus/generator-common@1.4.1

## 1.3.1

### Patch Changes

- Updated dependencies [b8188524]
  - @openapi-generator-plus/typescript-generator-common@1.7.1
  - @openapi-generator-plus/typescript-fetch-client-generator@1.6.1

## 1.3.0

### Minor Changes

- 26c8e2bd: Fix handling of catch-all responses

### Patch Changes

- Updated dependencies [26c8e2bd]
  - @openapi-generator-plus/typescript-fetch-client-generator@1.6.0
  - @openapi-generator-plus/handlebars-templates@1.4.0
  - @openapi-generator-plus/typescript-generator-common@1.7.0
  - @openapi-generator-plus/generator-common@1.4.0

## 1.2.5

### Patch Changes

- bc8647d6: Update core
- Updated dependencies [bc8647d6]
  - @openapi-generator-plus/typescript-fetch-client-generator@1.5.6
  - @openapi-generator-plus/handlebars-templates@1.3.5
  - @openapi-generator-plus/typescript-generator-common@1.6.5
  - @openapi-generator-plus/generator-common@1.3.9

## 1.2.4

### Patch Changes

- 9b87ba44: Update core
- Updated dependencies [9b87ba44]
  - @openapi-generator-plus/typescript-fetch-client-generator@1.5.5
  - @openapi-generator-plus/handlebars-templates@1.3.4
  - @openapi-generator-plus/typescript-generator-common@1.6.4
  - @openapi-generator-plus/generator-common@1.3.8

## 1.2.3

### Patch Changes

- cc2bb308: Update core types
- Updated dependencies [cc2bb308]
  - @openapi-generator-plus/typescript-fetch-client-generator@1.5.4
  - @openapi-generator-plus/handlebars-templates@1.3.3
  - @openapi-generator-plus/typescript-generator-common@1.6.3
  - @openapi-generator-plus/generator-common@1.3.7

## 1.2.2

### Patch Changes

- 81de680: Update to latest core types
- Updated dependencies [81de680]
  - @openapi-generator-plus/typescript-fetch-client-generator@1.5.3
  - @openapi-generator-plus/handlebars-templates@1.3.2
  - @openapi-generator-plus/typescript-generator-common@1.6.2
  - @openapi-generator-plus/generator-common@1.3.6

## 1.2.1

### Patch Changes

- d41da8d: Upgrade core types
- b6d16d9: Update dependencies
- Updated dependencies [d41da8d]
- Updated dependencies [b6d16d9]
- Updated dependencies [1f8b503]
  - @openapi-generator-plus/typescript-fetch-client-generator@1.5.2
  - @openapi-generator-plus/handlebars-templates@1.3.1
  - @openapi-generator-plus/typescript-generator-common@1.6.1
  - @openapi-generator-plus/generator-common@1.3.5

## 1.2.0

### Minor Changes

- 8c9c533: Update third party dependencies

### Patch Changes

- Updated dependencies [59c2ca9]
- Updated dependencies [8c9c533]
  - @openapi-generator-plus/generator-common@1.3.4
  - @openapi-generator-plus/handlebars-templates@1.3.0
  - @openapi-generator-plus/typescript-generator-common@1.6.0
  - @openapi-generator-plus/typescript-fetch-client-generator@1.5.1

## 1.1.6

### Patch Changes

- Updated dependencies [a5561e1]
- Updated dependencies [958a0a8]
  - @openapi-generator-plus/typescript-generator-common@1.5.4
  - @openapi-generator-plus/typescript-fetch-client-generator@1.5.0

## 1.1.5

### Patch Changes

- da518bb: Update core types
- Updated dependencies [da518bb]
  - @openapi-generator-plus/typescript-fetch-client-generator@1.4.3
  - @openapi-generator-plus/handlebars-templates@1.2.4
  - @openapi-generator-plus/typescript-generator-common@1.5.3
  - @openapi-generator-plus/generator-common@1.3.3

## 1.1.4

### Patch Changes

- Updated dependencies [5601ab5]
  - @openapi-generator-plus/handlebars-templates@1.2.3
  - @openapi-generator-plus/typescript-fetch-client-generator@1.4.2
  - @openapi-generator-plus/typescript-generator-common@1.5.2

## 1.1.3

### Patch Changes

- 9732cd1: Update core to 2.3.0
- Updated dependencies [9732cd1]
- Updated dependencies [bd75c7d]
  - @openapi-generator-plus/generator-common@1.3.2
  - @openapi-generator-plus/handlebars-templates@1.2.2
  - @openapi-generator-plus/typescript-generator-common@1.5.1
  - @openapi-generator-plus/typescript-fetch-client-generator@1.4.1

## 1.1.2

### Patch Changes

- Updated dependencies [7477d77]
  - @openapi-generator-plus/typescript-generator-common@1.5.0
  - @openapi-generator-plus/typescript-fetch-client-generator@1.4.0

## 1.1.1

### Patch Changes

- 691f556: Update core to 2.2.0
- 75f9ee3: Include DOM lib for missing functions
- Updated dependencies [691f556]
- Updated dependencies [84e4151]
  - @openapi-generator-plus/generator-common@1.3.1
  - @openapi-generator-plus/handlebars-templates@1.2.1
  - @openapi-generator-plus/typescript-generator-common@1.4.0
  - @openapi-generator-plus/typescript-fetch-client-generator@1.3.1

## 1.1.0

### Minor Changes

- db48add: Upgrade core types to 2.1.0 to return the `initialValue` function removed incorrectly in 2.0.0

### Patch Changes

- Updated dependencies [02405ff]
- Updated dependencies [db48add]
  - @openapi-generator-plus/typescript-generator-common@1.3.0
  - @openapi-generator-plus/generator-common@1.3.0
  - @openapi-generator-plus/handlebars-templates@1.2.0
  - @openapi-generator-plus/typescript-fetch-client-generator@1.3.0

## 1.0.5

### Patch Changes

- 19a8994: Update @openapi-generator-plus/core to 2.0.0

  _Note_ Please check the changelog for Java generators for breaking changes to the default values in generated model classes.

- Updated dependencies [19a8994]
- Updated dependencies [0664881]
- Updated dependencies [87bd6b5]
  - @openapi-generator-plus/generator-common@1.2.0
  - @openapi-generator-plus/handlebars-templates@1.1.4
  - @openapi-generator-plus/typescript-generator-common@1.2.0
  - @openapi-generator-plus/typescript-fetch-client-generator@1.2.1

## 1.0.4

### Patch Changes

- Updated dependencies [2842518]
- Updated dependencies [072fe50]
  - @openapi-generator-plus/typescript-generator-common@1.1.0
  - @openapi-generator-plus/typescript-fetch-client-generator@1.2.0
  - @openapi-generator-plus/handlebars-templates@1.1.3

## 1.0.3

### Patch Changes

- 4ea4845: Tidy dependencies on @openapi-generator-plus core modules
- cab735b: Upgrade dependencies
- Updated dependencies [4ea4845]
- Updated dependencies [cab735b]
  - @openapi-generator-plus/generator-common@1.1.2
  - @openapi-generator-plus/handlebars-templates@1.1.2
  - @openapi-generator-plus/typescript-generator-common@1.0.2
  - @openapi-generator-plus/typescript-fetch-client-generator@1.1.2

## 1.0.2

### Patch Changes

- cb18c75: Upgrade dependencies
- Updated dependencies [be034fb]
- Updated dependencies [53b8a63]
- Updated dependencies [cb18c75]
  - @openapi-generator-plus/handlebars-templates@1.1.0
  - @openapi-generator-plus/typescript-fetch-client-generator@1.1.1

## 1.0.1

### Patch Changes

- b46fa0c: Use pnpm to install for speed-up, and to build to avoid using TypeScript API
- Updated dependencies [555ee39]
- Updated dependencies [b46fa0c]
  - @openapi-generator-plus/typescript-fetch-client-generator@1.1.0

## 1.0.0

### Major Changes

- 8717cfb: First major release

### Patch Changes

- Updated dependencies [63e4795]
- Updated dependencies [8717cfb]
  - @openapi-generator-plus/handlebars-templates@1.0.0
  - @openapi-generator-plus/typescript-generator-common@1.0.0
  - @openapi-generator-plus/typescript-fetch-client-generator@3.0.0

## 0.4.15

### Patch Changes

- Updated dependencies [7c0f5ec]
- Updated dependencies [b5f3bf9]
- Updated dependencies [1109255]
  - @openapi-generator-plus/typescript-generator-common@0.25.7
  - @openapi-generator-plus/typescript-fetch-client-generator@0.35.0
  - @openapi-generator-plus/handlebars-templates@0.27.1

## 0.4.14

### Patch Changes

- Updated dependencies [3fc7ccf]
  - @openapi-generator-plus/typescript-fetch-client-generator@0.34.0

## 0.4.13

### Patch Changes

- Updated dependencies [8793a55]
- Updated dependencies [94ff264]
- Updated dependencies [29f4f58]
- Updated dependencies [9056504]
  - @openapi-generator-plus/typescript-fetch-client-generator@0.33.0

## 0.4.12

### Patch Changes

- Updated dependencies [23171d5]
  - @openapi-generator-plus/handlebars-templates@0.27.0
  - @openapi-generator-plus/typescript-generator-common@0.25.6
  - @openapi-generator-plus/typescript-fetch-client-generator@0.32.1

## 0.4.11

### Patch Changes

- Updated dependencies [3b2b515]
- Updated dependencies [807775a]
- Updated dependencies [0cc86ee]
  - @openapi-generator-plus/typescript-fetch-client-generator@0.32.0
  - @openapi-generator-plus/typescript-generator-common@0.25.5

## 0.4.10

### Patch Changes

- 2e840bb: Standardise on OpenAPI Generator Plus instead of OpenAPI Generator+
- Updated dependencies [2e840bb]
  - @openapi-generator-plus/typescript-generator-common@0.25.4
  - @openapi-generator-plus/typescript-fetch-client-generator@0.31.5

## 0.4.9

### Patch Changes

- 28e4e3b: Standardise terminology from generator module to generator template
- Updated dependencies [28e4e3b]
  - @openapi-generator-plus/typescript-fetch-client-generator@0.31.4

## 0.4.8

### Patch Changes

- b45576a: Update package.json metadata to include better homepage URLs
- Updated dependencies [b45576a]
  - @openapi-generator-plus/handlebars-templates@0.26.1
  - @openapi-generator-plus/typescript-generator-common@0.25.3
  - @openapi-generator-plus/typescript-fetch-client-generator@0.31.3

## 0.4.7

### Patch Changes

- Updated dependencies [630ba24]
- Updated dependencies [25a8ab6]
- Updated dependencies [0cfd306]
  - @openapi-generator-plus/handlebars-templates@0.26.0
  - @openapi-generator-plus/typescript-generator-common@0.25.2
  - @openapi-generator-plus/typescript-fetch-client-generator@0.31.2

## 0.4.6

### Patch Changes

- Updated dependencies [e72fec6]
- Updated dependencies [9afa386]
- Updated dependencies [ad19364]
- Updated dependencies [a2ae651]
- Updated dependencies [c1da0ee]
  - @openapi-generator-plus/handlebars-templates@0.25.0
  - @openapi-generator-plus/typescript-generator-common@0.25.1
  - @openapi-generator-plus/typescript-fetch-client-generator@0.31.1

## 0.4.5

### Patch Changes

- Updated dependencies [ff4ee4f]
- Updated dependencies [10aeb32]
- Updated dependencies [9c992d5]
- Updated dependencies [11b32c0]
  - @openapi-generator-plus/handlebars-templates@0.24.0
  - @openapi-generator-plus/typescript-generator-common@0.25.0
  - @openapi-generator-plus/typescript-fetch-client-generator@0.31.0

## 0.4.4

### Patch Changes

- Updated dependencies [26e7810]
- Updated dependencies [135a732]
  - @openapi-generator-plus/handlebars-templates@0.23.0
  - @openapi-generator-plus/typescript-generator-common@0.24.0
  - @openapi-generator-plus/typescript-fetch-client-generator@0.30.0

## 0.4.3

### Patch Changes

- Updated dependencies [fa0f593]
- Updated dependencies [5d3a6fe]
  - @openapi-generator-plus/handlebars-templates@0.22.0
  - @openapi-generator-plus/typescript-generator-common@0.23.0
  - @openapi-generator-plus/typescript-fetch-client-generator@0.29.2

## 0.4.2

### Patch Changes

- Updated dependencies [b5ad150]
  - @openapi-generator-plus/handlebars-templates@0.21.0
  - @openapi-generator-plus/typescript-generator-common@0.22.5
  - @openapi-generator-plus/typescript-fetch-client-generator@0.29.1

## 0.4.1

### Patch Changes

- Updated dependencies [cb453ba]
- Updated dependencies [6c1300d]
- Updated dependencies [83a47f4]
  - @openapi-generator-plus/typescript-fetch-client-generator@0.29.0
  - @openapi-generator-plus/handlebars-templates@0.20.1

## 0.4.0

### Minor Changes

- 419828e: Improve parameter serialization including removing x-serialize-nested-as-json vendor extension and making that the default (as that's what editor.swagger.io) does, fixing serialization of header parameters

### Patch Changes

- Updated dependencies [419828e]
- Updated dependencies [742a47d]
- Updated dependencies [15d56ca]
  - @openapi-generator-plus/typescript-fetch-client-generator@0.28.0

## 0.3.2

### Patch Changes

- Updated dependencies [6f81fa5]
- Updated dependencies [37478df]
- Updated dependencies [c34292b]
- Updated dependencies [cdc41e6]
- Updated dependencies [38d4257]
  - @openapi-generator-plus/handlebars-templates@0.20.0
  - @openapi-generator-plus/typescript-fetch-client-generator@0.27.0
  - @openapi-generator-plus/typescript-generator-common@0.22.4

## 0.3.1

### Patch Changes

- Updated dependencies [a6146f6]
  - @openapi-generator-plus/typescript-fetch-client-generator@0.26.0

## 0.3.0

### Minor Changes

- ee03854: Core update

### Patch Changes

- Updated dependencies [7a86b15]
- Updated dependencies [7c50b17]
- Updated dependencies [ee03854]
  - @openapi-generator-plus/handlebars-templates@0.19.0
  - @openapi-generator-plus/typescript-fetch-client-generator@0.25.1
  - @openapi-generator-plus/typescript-generator-common@0.22.2

## 0.2.3

### Patch Changes

- Updated dependencies [9f6ef06]
- Updated dependencies [9dbd093]
- Updated dependencies [83cde2b]
  - @openapi-generator-plus/typescript-fetch-client-generator@0.25.0

## 0.2.2

### Patch Changes

- Updated dependencies [a84fd09]
- Updated dependencies [04d59a7]
- Updated dependencies [68cc337]
- Updated dependencies [60f75a9]
- Updated dependencies [bab3808]
  - @openapi-generator-plus/handlebars-templates@0.18.0
  - @openapi-generator-plus/typescript-generator-common@0.22.1
  - @openapi-generator-plus/typescript-fetch-client-generator@0.24.0

## 0.2.1

### Patch Changes

- a65b3ce: Upgrade dependencies
- Updated dependencies [a65b3ce]
  - @openapi-generator-plus/handlebars-templates@0.17.1
  - @openapi-generator-plus/typescript-fetch-client-generator@0.23.1

## 0.2.0

### Minor Changes

- 86c4e5d: Support the allOf, anyOf, oneOf handling changes in core.

### Patch Changes

- 05d3c03: Changed from lerna to pnpm for monorepo management, and changesets for releases and versioning
- Updated dependencies [05d3c03]
- Updated dependencies [86c4e5d]
  - @openapi-generator-plus/handlebars-templates@0.17.0
  - @openapi-generator-plus/typescript-generator-common@0.22.0
  - @openapi-generator-plus/typescript-fetch-client-generator@0.23.0
