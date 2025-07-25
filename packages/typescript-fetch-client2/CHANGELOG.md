# @openapi-generator-plus/typescript-fetch-client-generator2

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
