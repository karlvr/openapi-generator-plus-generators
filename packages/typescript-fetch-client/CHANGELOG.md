# @openapi-generator-plus/typescript-fetch-client-generator

## 1.12.1

### Patch Changes

- Updated dependencies [c8cea0e]
  - @openapi-generator-plus/handlebars-templates@1.11.2
  - @openapi-generator-plus/typescript-generator-common@1.12.1

## 1.12.0

### Minor Changes

- f97a924: Don't overwrite the README if it already exists

## 1.11.0

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

## 1.10.2

### Patch Changes

- Updated dependencies [8c59015]
  - @openapi-generator-plus/handlebars-templates@1.11.0
  - @openapi-generator-plus/typescript-generator-common@1.11.2

## 1.10.1

### Patch Changes

- Updated dependencies [8b4824a]
  - @openapi-generator-plus/handlebars-templates@1.10.0
  - @openapi-generator-plus/typescript-generator-common@1.11.1

## 1.10.0

### Minor Changes

- 382b02c: Bump core version and now explicitly depend upon core

### Patch Changes

- Updated dependencies [382b02c]
  - @openapi-generator-plus/handlebars-templates@1.9.0
  - @openapi-generator-plus/typescript-generator-common@1.11.0
  - @openapi-generator-plus/generator-common@1.7.0

## 1.9.1

### Patch Changes

- Updated dependencies [2685ee7]
  - @openapi-generator-plus/generator-common@1.6.1
  - @openapi-generator-plus/handlebars-templates@1.8.1
  - @openapi-generator-plus/typescript-generator-common@1.10.1

## 1.9.0

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

## 1.8.0

### Minor Changes

- 9e1dc23: Update upstream

### Patch Changes

- Updated dependencies [9e1dc23]
- Updated dependencies [3363813]
  - @openapi-generator-plus/handlebars-templates@1.7.0
  - @openapi-generator-plus/typescript-generator-common@1.9.0
  - @openapi-generator-plus/generator-common@1.5.0

## 1.7.2

### Patch Changes

- Updated dependencies [4b9c50f]
  - @openapi-generator-plus/handlebars-templates@1.6.0
  - @openapi-generator-plus/typescript-generator-common@1.8.2

## 1.7.1

### Patch Changes

- Updated dependencies [df4a78f]
  - @openapi-generator-plus/handlebars-templates@1.5.1
  - @openapi-generator-plus/typescript-generator-common@1.8.1

## 1.7.0

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

## 1.6.1

### Patch Changes

- Updated dependencies [b8188524]
  - @openapi-generator-plus/typescript-generator-common@1.7.1

## 1.6.0

### Minor Changes

- 26c8e2bd: Fix handling of catch-all responses

### Patch Changes

- Updated dependencies [26c8e2bd]
  - @openapi-generator-plus/handlebars-templates@1.4.0
  - @openapi-generator-plus/typescript-generator-common@1.7.0
  - @openapi-generator-plus/generator-common@1.4.0

## 1.5.6

### Patch Changes

- bc8647d6: Update core
- Updated dependencies [bc8647d6]
  - @openapi-generator-plus/handlebars-templates@1.3.5
  - @openapi-generator-plus/typescript-generator-common@1.6.5
  - @openapi-generator-plus/generator-common@1.3.9

## 1.5.5

### Patch Changes

- 9b87ba44: Update core
- Updated dependencies [9b87ba44]
  - @openapi-generator-plus/handlebars-templates@1.3.4
  - @openapi-generator-plus/typescript-generator-common@1.6.4
  - @openapi-generator-plus/generator-common@1.3.8

## 1.5.4

### Patch Changes

- cc2bb308: Update core types
- Updated dependencies [cc2bb308]
  - @openapi-generator-plus/handlebars-templates@1.3.3
  - @openapi-generator-plus/typescript-generator-common@1.6.3
  - @openapi-generator-plus/generator-common@1.3.7

## 1.5.3

### Patch Changes

- 81de680: Update to latest core types
- Updated dependencies [81de680]
  - @openapi-generator-plus/handlebars-templates@1.3.2
  - @openapi-generator-plus/typescript-generator-common@1.6.2
  - @openapi-generator-plus/generator-common@1.3.6

## 1.5.2

### Patch Changes

- d41da8d: Upgrade core types
- b6d16d9: Update dependencies
- Updated dependencies [d41da8d]
- Updated dependencies [b6d16d9]
- Updated dependencies [1f8b503]
  - @openapi-generator-plus/handlebars-templates@1.3.1
  - @openapi-generator-plus/typescript-generator-common@1.6.1
  - @openapi-generator-plus/generator-common@1.3.5

## 1.5.1

### Patch Changes

- Updated dependencies [59c2ca9]
- Updated dependencies [8c9c533]
  - @openapi-generator-plus/generator-common@1.3.4
  - @openapi-generator-plus/handlebars-templates@1.3.0
  - @openapi-generator-plus/typescript-generator-common@1.6.0

## 1.5.0

### Minor Changes

- 958a0a8: Bump node dependencies in the package.json in the generator output to workaround lowest version resolution in pnpm 8

### Patch Changes

- Updated dependencies [a5561e1]
  - @openapi-generator-plus/typescript-generator-common@1.5.4

## 1.4.3

### Patch Changes

- da518bb: Update core types
- Updated dependencies [da518bb]
  - @openapi-generator-plus/handlebars-templates@1.2.4
  - @openapi-generator-plus/typescript-generator-common@1.5.3
  - @openapi-generator-plus/generator-common@1.3.3

## 1.4.2

### Patch Changes

- 5601ab5: Support illegal identifiers in model interfaces
- Updated dependencies [5601ab5]
  - @openapi-generator-plus/handlebars-templates@1.2.3
  - @openapi-generator-plus/typescript-generator-common@1.5.2

## 1.4.1

### Patch Changes

- 9732cd1: Update core to 2.3.0
- bd75c7d: Fix whitespace in interface extends
- Updated dependencies [9732cd1]
  - @openapi-generator-plus/generator-common@1.3.2
  - @openapi-generator-plus/handlebars-templates@1.2.2
  - @openapi-generator-plus/typescript-generator-common@1.5.1

## 1.4.0

### Minor Changes

- 7477d77: Change approach for discriminator inheritance incompatibility to use Omit rather than resorting to avoiding inheritance

### Patch Changes

- Updated dependencies [7477d77]
  - @openapi-generator-plus/typescript-generator-common@1.5.0

## 1.3.1

### Patch Changes

- 691f556: Update core to 2.2.0
- Updated dependencies [691f556]
- Updated dependencies [84e4151]
  - @openapi-generator-plus/generator-common@1.3.1
  - @openapi-generator-plus/handlebars-templates@1.2.1
  - @openapi-generator-plus/typescript-generator-common@1.4.0

## 1.3.0

### Minor Changes

- db48add: Upgrade core types to 2.1.0 to return the `initialValue` function removed incorrectly in 2.0.0

### Patch Changes

- Updated dependencies [02405ff]
- Updated dependencies [db48add]
  - @openapi-generator-plus/typescript-generator-common@1.3.0
  - @openapi-generator-plus/generator-common@1.3.0
  - @openapi-generator-plus/handlebars-templates@1.2.0

## 1.2.1

### Patch Changes

- 19a8994: Update @openapi-generator-plus/core to 2.0.0

  _Note_ Please check the changelog for Java generators for breaking changes to the default values in generated model classes.

- Updated dependencies [19a8994]
- Updated dependencies [0664881]
- Updated dependencies [87bd6b5]
  - @openapi-generator-plus/generator-common@1.2.0
  - @openapi-generator-plus/handlebars-templates@1.1.4
  - @openapi-generator-plus/typescript-generator-common@1.2.0

## 1.2.0

### Minor Changes

- 2842518: Add blind-date configuration for date-time implementation type

### Patch Changes

- Updated dependencies [2842518]
- Updated dependencies [072fe50]
  - @openapi-generator-plus/typescript-generator-common@1.1.0
  - @openapi-generator-plus/handlebars-templates@1.1.3

## 1.1.2

### Patch Changes

- 4ea4845: Tidy dependencies on @openapi-generator-plus core modules
- Updated dependencies [4ea4845]
- Updated dependencies [cab735b]
  - @openapi-generator-plus/generator-common@1.1.2
  - @openapi-generator-plus/handlebars-templates@1.1.2
  - @openapi-generator-plus/typescript-generator-common@1.0.2

## 1.1.1

### Patch Changes

- 53b8a63: Fix interface properties' use of `frag/propertyDocumentation`
- Updated dependencies [be034fb]
- Updated dependencies [cb18c75]
  - @openapi-generator-plus/generator-common@1.1.0
  - @openapi-generator-plus/handlebars-templates@1.1.0

## 1.1.0

### Minor Changes

- 555ee39: Don't include forbidden headers in the client API

### Patch Changes

- b46fa0c: Use pnpm to install for speed-up, and to build to avoid using TypeScript API

## 1.0.0

### Major Changes

- 8717cfb: First major release

## 0.35.0

### Minor Changes

- b5f3bf9: The value type for additionalProperties should include undefined so they don't conflict with real properties that may be undefined

### Patch Changes

- Updated dependencies [7c0f5ec]
- Updated dependencies [a16fa0b]
- Updated dependencies [1109255]
  - @openapi-generator-plus/typescript-generator-common@0.25.7
  - @openapi-generator-plus/generator-common@0.26.0
  - @openapi-generator-plus/handlebars-templates@0.27.1

## 0.34.0

### Minor Changes

- 3fc7ccf: Change property documentation style to fix use of HTML markup

## 0.33.0

### Minor Changes

- 9056504: Add @deprecated annotation on deprecated schemas
- 8793a55: Add @deprecated annotation on deprecated parameters
- 94ff264: Add @deprecated annotation on deprecated API calls
- 29f4f58: Parameter documentation now supports markdown

## 0.32.1

### Patch Changes

- Updated dependencies [23171d5]
  - @openapi-generator-plus/handlebars-templates@0.27.0
  - @openapi-generator-plus/typescript-generator-common@0.25.6

## 0.32.0

### Minor Changes

- 3b2b515: Handle response codes and media types as defined by the specification
- 807775a: Change response handling to examine schema type to decide whether to use binary or text handling if the mime type isn't JSON

  The client can now handle arbitrary binary responses such as images and PDFs, and arbitrary string responses.

### Patch Changes

- Updated dependencies [0cc86ee]
  - @openapi-generator-plus/typescript-generator-common@0.25.5

## 0.31.5

### Patch Changes

- 2e840bb: Standardise on OpenAPI Generator Plus instead of OpenAPI Generator+
- Updated dependencies [2e840bb]
  - @openapi-generator-plus/typescript-generator-common@0.25.4

## 0.31.4

### Patch Changes

- 28e4e3b: Standardise terminology from generator module to generator template

## 0.31.3

### Patch Changes

- b45576a: Update package.json metadata to include better homepage URLs
- Updated dependencies [51206bb]
- Updated dependencies [b45576a]
  - @openapi-generator-plus/generator-common@0.25.1
  - @openapi-generator-plus/handlebars-templates@0.26.1
  - @openapi-generator-plus/typescript-generator-common@0.25.3

## 0.31.2

### Patch Changes

- Updated dependencies [630ba24]
- Updated dependencies [e74d3ef]
- Updated dependencies [25a8ab6]
- Updated dependencies [0cfd306]
  - @openapi-generator-plus/handlebars-templates@0.26.0
  - @openapi-generator-plus/generator-common@0.25.0
  - @openapi-generator-plus/typescript-generator-common@0.25.2

## 0.31.1

### Patch Changes

- c1da0ee: Fix incorrect reference to component schema after core changes
- Updated dependencies [e72fec6]
- Updated dependencies [9afa386]
- Updated dependencies [ad19364]
- Updated dependencies [a2ae651]
  - @openapi-generator-plus/handlebars-templates@0.25.0
  - @openapi-generator-plus/typescript-generator-common@0.25.1
  - @openapi-generator-plus/generator-common@0.24.0

## 0.31.0

### Minor Changes

- 10aeb32: Fixes for CodegenRequestBody.nativeType changing to nullable
- 11b32c0: No longer need to check for nullable parameters due to core change

### Patch Changes

- Updated dependencies [ff4ee4f]
- Updated dependencies [2f5e239]
- Updated dependencies [9c992d5]
  - @openapi-generator-plus/handlebars-templates@0.24.0
  - @openapi-generator-plus/typescript-generator-common@0.25.0
  - @openapi-generator-plus/generator-common@0.23.0

## 0.30.0

### Minor Changes

- 135a732: Update for core discriminator changes and additional generator options

### Patch Changes

- Updated dependencies [26e7810]
- Updated dependencies [135a732]
- Updated dependencies [24823f9]
  - @openapi-generator-plus/handlebars-templates@0.23.0
  - @openapi-generator-plus/generator-common@0.22.0
  - @openapi-generator-plus/typescript-generator-common@0.24.0

## 0.29.2

### Patch Changes

- Updated dependencies [fa0f593]
- Updated dependencies [5d3a6fe]
  - @openapi-generator-plus/generator-common@0.21.0
  - @openapi-generator-plus/handlebars-templates@0.22.0
  - @openapi-generator-plus/typescript-generator-common@0.23.0

## 0.29.1

### Patch Changes

- Updated dependencies [b5ad150]
  - @openapi-generator-plus/generator-common@0.20.0
  - @openapi-generator-plus/handlebars-templates@0.21.0
  - @openapi-generator-plus/typescript-generator-common@0.22.5

## 0.29.0

### Minor Changes

- 83a47f4: Update blind-date to 3.2.0 to fix timestamp regex bug

### Patch Changes

- cb453ba: Fix missing includePolyfills check around the import of whatwg-fetch
- Updated dependencies [6c1300d]
  - @openapi-generator-plus/handlebars-templates@0.20.1

## 0.28.0

### Minor Changes

- 419828e: Improve parameter serialization including removing x-serialize-nested-as-json vendor extension and making that the default (as that's what editor.swagger.io) does, fixing serialization of header parameters
- 742a47d: Add support for readOnly and writeOnly properties
- 15d56ca: Add support for cookie params

  Note that this doesn't work in browser API clients, see https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_header_name

## 0.27.0

### Minor Changes

- 38d4257: Support x-serialize-nested-as-json on CodegenParameter to serialize nested items as JSON

### Patch Changes

- 37478df: Fix the serializedName of a property not being correctly used when serializing an object in a parameter
- Updated dependencies [6f81fa5]
- Updated dependencies [c34292b]
- Updated dependencies [cdc41e6]
  - @openapi-generator-plus/handlebars-templates@0.20.0
  - @openapi-generator-plus/generator-common@0.19.0
  - @openapi-generator-plus/typescript-generator-common@0.22.4

## 0.26.0

### Minor Changes

- a6146f6: Add a configuration option to exclude polyfills

## 0.25.1

### Patch Changes

- 7c50b17: Log warnings for unsupported encoding styles
- Updated dependencies [7a86b15]
- Updated dependencies [ee03854]
  - @openapi-generator-plus/handlebars-templates@0.19.0
  - @openapi-generator-plus/generator-common@0.18.0
  - @openapi-generator-plus/typescript-generator-common@0.22.2

## 0.25.0

### Minor Changes

- 9f6ef06: Support parameter serializedName and fix more object serializedName cases

### Patch Changes

- 9dbd093: Fix x-www-form-urlencoded body handling

  I left in the old code after the previous upgrade to respect encodings.

- 83cde2b: Correctly handle object properties that have a different serialized name

## 0.24.0

### Minor Changes

- 68cc337: Add support for parameter encoding styles for parameters and x-www-form-urlencoded bodies
- bab3808: Documentation improvements and externalDocs support

  I've removed some of the @ annotations in the documentation that I didn't think were still useful
  in a TypeScript world. I hope that was correct.

### Patch Changes

- Updated dependencies [a84fd09]
- Updated dependencies [04d59a7]
- Updated dependencies [60f75a9]
  - @openapi-generator-plus/handlebars-templates@0.18.0
  - @openapi-generator-plus/typescript-generator-common@0.22.1

## 0.23.1

### Patch Changes

- a65b3ce: Upgrade dependencies
- Updated dependencies [a65b3ce]
  - @openapi-generator-plus/generator-common@0.17.1
  - @openapi-generator-plus/handlebars-templates@0.17.1

## 0.23.0

### Minor Changes

- 86c4e5d: Support the allOf, anyOf, oneOf handling changes in core.

### Patch Changes

- 05d3c03: Changed from lerna to pnpm for monorepo management, and changesets for releases and versioning
- Updated dependencies [05d3c03]
- Updated dependencies [86c4e5d]
  - @openapi-generator-plus/generator-common@0.17.0
  - @openapi-generator-plus/handlebars-templates@0.17.0
  - @openapi-generator-plus/typescript-generator-common@0.22.0
