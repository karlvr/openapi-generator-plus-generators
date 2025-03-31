# @openapi-generator-plus/java-jaxrs-server-generator

## 3.6.0

### Minor Changes

- 58ccf51: Overlapping paths on operation groups don't work in Java

### Patch Changes

- 4b1a63c: Fix HTML encoding in generated response exception parameters
- Updated dependencies [58ccf51]
  - @openapi-generator-plus/java-jaxrs-generator-common@3.7.0

## 3.5.2

### Patch Changes

- Updated dependencies [d39391e]
- Updated dependencies [14579f3]
- Updated dependencies [1b74cc4]
- Updated dependencies [cb8a924]
  - @openapi-generator-plus/java-jaxrs-generator-common@3.6.0

## 3.5.1

### Patch Changes

- Updated dependencies [a4160fc]
- Updated dependencies [4504739]
  - @openapi-generator-plus/java-jaxrs-generator-common@3.5.1

## 3.5.0

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

## 3.4.1

### Patch Changes

- Updated dependencies [1b09e3f]
- Updated dependencies [8c59015]
  - @openapi-generator-plus/java-jaxrs-generator-common@3.4.0
  - @openapi-generator-plus/handlebars-templates@1.11.0

## 3.4.0

### Minor Changes

- 004a933: Add more API metadata annotations

### Patch Changes

- Updated dependencies [004a933]
- Updated dependencies [8b4824a]
- Updated dependencies [9479c07]
- Updated dependencies [5fa5e01]
  - @openapi-generator-plus/java-jaxrs-generator-common@3.3.0
  - @openapi-generator-plus/handlebars-templates@1.10.0

## 3.3.0

### Minor Changes

- 4d13640: Make AbstractApiJaxbJsonProvider more customisable in code.

  Rather than relying on replacing a Handlebars frag.

## 3.2.0

### Minor Changes

- 1906f7d: Generate ApiJaxbJsonProvider as an abstract class so users can modify the implementation without it being overwritten
- 6a86174: Allow setting the invoker application name
- 25a6066: Move explicit configuration of JAX-RS application into java-jaxrs-server package
- 0cddbff: Generate JAX-RS application as an abstract class so we can always overwrite the code and include all API endpoints.
- 382b02c: Bump core version and now explicitly depend upon core

### Patch Changes

- Updated dependencies [28ef5ff]
- Updated dependencies [0cddbff]
- Updated dependencies [382b02c]
  - @openapi-generator-plus/java-jaxrs-generator-common@3.2.0
  - @openapi-generator-plus/handlebars-templates@1.9.0
  - @openapi-generator-plus/generator-common@1.7.0
  - @openapi-generator-plus/java-like-generator-helper@2.5.0

## 3.1.0

### Minor Changes

- 11ddeec: Change RestApplication / invoker to explicitly initialize the JAX-RS application

  This is to improve security and sureity of your JAX-RS application so you know exactly which
  endpoints and providers are in play, rather than using automatic discovery.

- 4012bea: Give the invoker template access to the API groups

### Patch Changes

- 00bd0e7: Move invoker.hbs template from common to server
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
- 0758c0a: Add operation group tags
- f9ba44d: Add useLombok option for models
- 2bc3447: Add more metadata annotations to enums and improve `@Schema` annotations on models
- 5b78af2: Upgrade core
- 1e8f5da: Move cleaning of *Api.java and *ApiImpl.java to the package that creates those files
- fbfc66c: Option to skip generating apiServiceImpl classes

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

## 2.2.11

### Patch Changes

- bc8647d6: Update core
- Updated dependencies [a1322325]
- Updated dependencies [bc8647d6]
  - @openapi-generator-plus/java-jaxrs-generator-common@2.6.0
  - @openapi-generator-plus/handlebars-templates@1.3.5
  - @openapi-generator-plus/generator-common@1.3.9
  - @openapi-generator-plus/java-like-generator-helper@2.1.10

## 2.2.10

### Patch Changes

- 9b87ba44: Update core
- Updated dependencies [9b87ba44]
  - @openapi-generator-plus/handlebars-templates@1.3.4
  - @openapi-generator-plus/java-jaxrs-generator-common@2.5.4
  - @openapi-generator-plus/generator-common@1.3.8
  - @openapi-generator-plus/java-like-generator-helper@2.1.9

## 2.2.9

### Patch Changes

- cc2bb308: Update core types
- Updated dependencies [cc2bb308]
  - @openapi-generator-plus/handlebars-templates@1.3.3
  - @openapi-generator-plus/java-jaxrs-generator-common@2.5.3
  - @openapi-generator-plus/generator-common@1.3.7
  - @openapi-generator-plus/java-like-generator-helper@2.1.8

## 2.2.8

### Patch Changes

- 81de680: Update to latest core types
- Updated dependencies [81de680]
  - @openapi-generator-plus/handlebars-templates@1.3.2
  - @openapi-generator-plus/java-jaxrs-generator-common@2.5.2
  - @openapi-generator-plus/generator-common@1.3.6
  - @openapi-generator-plus/java-like-generator-helper@2.1.7

## 2.2.7

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

## 2.2.6

### Patch Changes

- 50dd830: Bump to fix broken archive

## 2.2.5

### Patch Changes

- 4979620: Fix javax reference in JavaDoc when using jakarta
- e45f689: Use preferred cache control from string method. Will prevent deprecated warnings for those using jakarta.
- Updated dependencies [59c2ca9]
- Updated dependencies [1862f39]
- Updated dependencies [8c9c533]
  - @openapi-generator-plus/generator-common@1.3.4
  - @openapi-generator-plus/java-jaxrs-generator-common@2.5.0
  - @openapi-generator-plus/handlebars-templates@1.3.0
  - @openapi-generator-plus/java-like-generator-helper@2.1.5

## 2.2.4

### Patch Changes

- b792e14: Remove superfluous JAX-RS annotations from the API implementation
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

- Updated dependencies [63e4795]
- Updated dependencies [8717cfb]
  - @openapi-generator-plus/generator-common@1.0.0
  - @openapi-generator-plus/handlebars-templates@1.0.0
  - @openapi-generator-plus/java-jaxrs-generator-common@1.0.0
  - @openapi-generator-plus/java-like-generator-helper@1.0.0

## 0.37.9

### Patch Changes

- 7c0f5ec: Fix ability to explicitly set some config options to null
- Updated dependencies [b6297ef]
- Updated dependencies [a16fa0b]
- Updated dependencies [efaea2a]
- Updated dependencies [1109255]
  - @openapi-generator-plus/java-jaxrs-generator-common@0.36.0
  - @openapi-generator-plus/generator-common@0.26.0
  - @openapi-generator-plus/handlebars-templates@0.27.1
  - @openapi-generator-plus/java-like-generator-helper@0.16.4

## 0.37.8

### Patch Changes

- Updated dependencies [f99980e]
  - @openapi-generator-plus/java-jaxrs-generator-common@0.35.0

## 0.37.7

### Patch Changes

- Updated dependencies [23171d5]
  - @openapi-generator-plus/handlebars-templates@0.27.0
  - @openapi-generator-plus/java-jaxrs-generator-common@0.34.1

## 0.37.6

### Patch Changes

- 8558822: Add a config option for the binary data representation to use
- Updated dependencies [8558822]
- Updated dependencies [3592e5a]
- Updated dependencies [0cc86ee]
  - @openapi-generator-plus/java-jaxrs-generator-common@0.34.0

## 0.37.5

### Patch Changes

- 2e840bb: Standardise on OpenAPI Generator Plus instead of OpenAPI Generator+
- Updated dependencies [2e840bb]
  - @openapi-generator-plus/java-jaxrs-generator-common@0.33.5

## 0.37.4

### Patch Changes

- 28e4e3b: Standardise terminology from generator module to generator template
- Updated dependencies [28e4e3b]
  - @openapi-generator-plus/java-jaxrs-generator-common@0.33.4

## 0.37.3

### Patch Changes

- b45576a: Update package.json metadata to include better homepage URLs
- Updated dependencies [51206bb]
- Updated dependencies [b45576a]
  - @openapi-generator-plus/generator-common@0.25.1
  - @openapi-generator-plus/handlebars-templates@0.26.1
  - @openapi-generator-plus/java-jaxrs-generator-common@0.33.3
  - @openapi-generator-plus/java-like-generator-helper@0.16.3

## 0.37.2

### Patch Changes

- Updated dependencies [fc32aaf]
- Updated dependencies [630ba24]
- Updated dependencies [e74d3ef]
- Updated dependencies [25a8ab6]
- Updated dependencies [0cfd306]
  - @openapi-generator-plus/java-jaxrs-generator-common@0.33.2
  - @openapi-generator-plus/handlebars-templates@0.26.0
  - @openapi-generator-plus/generator-common@0.25.0
  - @openapi-generator-plus/java-like-generator-helper@0.16.2

## 0.37.1

### Patch Changes

- Updated dependencies [e72fec6]
- Updated dependencies [9afa386]
- Updated dependencies [ad19364]
- Updated dependencies [a2ae651]
  - @openapi-generator-plus/handlebars-templates@0.25.0
  - @openapi-generator-plus/java-jaxrs-generator-common@0.33.1
  - @openapi-generator-plus/generator-common@0.24.0
  - @openapi-generator-plus/java-like-generator-helper@0.16.1

## 0.37.0

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

## 0.36.0

### Minor Changes

- 135a732: Update for core discriminator changes and additional generator options

### Patch Changes

- Updated dependencies [26e7810]
- Updated dependencies [d4e4122]
- Updated dependencies [135a732]
- Updated dependencies [24823f9]
  - @openapi-generator-plus/handlebars-templates@0.23.0
  - @openapi-generator-plus/java-like-generator-helper@0.15.7
  - @openapi-generator-plus/generator-common@0.22.0
  - @openapi-generator-plus/java-jaxrs-generator-common@0.32.0

## 0.35.2

### Patch Changes

- Updated dependencies [fa0f593]
  - @openapi-generator-plus/generator-common@0.21.0
  - @openapi-generator-plus/handlebars-templates@0.22.0
  - @openapi-generator-plus/java-jaxrs-generator-common@0.31.2
  - @openapi-generator-plus/java-like-generator-helper@0.15.6

## 0.35.1

### Patch Changes

- Updated dependencies [b5ad150]
  - @openapi-generator-plus/generator-common@0.20.0
  - @openapi-generator-plus/handlebars-templates@0.21.0
  - @openapi-generator-plus/java-jaxrs-generator-common@0.31.1
  - @openapi-generator-plus/java-like-generator-helper@0.15.5

## 0.35.0

### Minor Changes

- 6c1300d: Validation enhanced to support asymmetric validation for when a readOnly or writeOnly is present

### Patch Changes

- Updated dependencies [6c1300d]
- Updated dependencies [6c1300d]
  - @openapi-generator-plus/handlebars-templates@0.20.1
  - @openapi-generator-plus/java-jaxrs-generator-common@0.31.0

## 0.34.0

### Minor Changes

- b9878c8: Add support for cookie params
- 742a47d: Add support for readOnly and writeOnly properties

### Patch Changes

- Updated dependencies [b9878c8]
- Updated dependencies [742a47d]
  - @openapi-generator-plus/java-jaxrs-generator-common@0.30.0

## 0.33.3

### Patch Changes

- Updated dependencies [6f81fa5]
- Updated dependencies [c34292b]
  - @openapi-generator-plus/handlebars-templates@0.20.0
  - @openapi-generator-plus/generator-common@0.19.0
  - @openapi-generator-plus/java-jaxrs-generator-common@0.29.1
  - @openapi-generator-plus/java-like-generator-helper@0.15.3

## 0.33.2

### Patch Changes

- Updated dependencies [48c6e39]
- Updated dependencies [cc30b0d]
  - @openapi-generator-plus/java-jaxrs-generator-common@0.29.0
  - @openapi-generator-plus/handlebars-templates@0.19.1

## 0.33.1

### Patch Changes

- Updated dependencies [7a86b15]
- Updated dependencies [ee03854]
  - @openapi-generator-plus/handlebars-templates@0.19.0
  - @openapi-generator-plus/generator-common@0.18.0
  - @openapi-generator-plus/java-jaxrs-generator-common@0.28.1
  - @openapi-generator-plus/java-like-generator-helper@0.15.2

## 0.33.0

### Minor Changes

- 9f6ef06: Support parameter serializedName and fix more object serializedName cases

## 0.32.0

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

## 0.31.1

### Patch Changes

- a65b3ce: Upgrade dependencies
- Updated dependencies [a65b3ce]
- Updated dependencies [0116337]
  - @openapi-generator-plus/generator-common@0.17.1
  - @openapi-generator-plus/handlebars-templates@0.17.1
  - @openapi-generator-plus/java-jaxrs-generator-common@0.27.1
  - @openapi-generator-plus/java-like-generator-helper@0.15.1

## 0.31.0

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
