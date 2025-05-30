# @openapi-generator-plus/handlebars-templates

## 1.11.2

### Patch Changes

- c8cea0e: Fix content type helpers for missing content

## 1.11.1

### Patch Changes

- 601553e: Update core
- Updated dependencies [601553e]
  - @openapi-generator-plus/generator-common@1.7.1

## 1.11.0

### Minor Changes

- 8c59015: Add support for template hooks specific to the generated class

## 1.10.0

### Minor Changes

- 8b4824a: Don't generate POJO required properties constructor

  This was a mistake. I am worried about the order of parameters in the constructor changing if the API spec changes, which
  could result in existing code that calls these constructors passing the wrong values to the wrong parameters
  as Java doesn't have named parameters. There's no guarantee about the order of properties in an object or that the
  required properties will stay consistent.

## 1.9.0

### Minor Changes

- 382b02c: Bump core version and now explicitly depend upon core

### Patch Changes

- Updated dependencies [382b02c]
  - @openapi-generator-plus/generator-common@1.7.0

## 1.8.1

### Patch Changes

- Updated dependencies [2685ee7]
  - @openapi-generator-plus/generator-common@1.6.1

## 1.8.0

### Minor Changes

- e52907f: Add isArrayValue and isObjectValue helpers
- f5080b5: Add isProperty and isParam helpers
- dfae89b: Allow join helper without varName to output joined string in place
- 50f5d88: Add isAny helper for the ANY type
- 820892f: Add nested property support to `set` and `join` helpers
- 5b78af2: Upgrade core
- e1d7fa3: Add unset helper
- 976d656: Improve warn helper to support concatenating arguments

### Patch Changes

- Updated dependencies [5b78af2]
  - @openapi-generator-plus/generator-common@1.6.0

## 1.7.0

### Minor Changes

- 9e1dc23: Update upstream

### Patch Changes

- Updated dependencies [9e1dc23]
  - @openapi-generator-plus/generator-common@1.5.0

## 1.6.0

### Minor Changes

- 4b9c50f: Add isNull and isNotNull helpers

## 1.5.1

### Patch Changes

- df4a78f: set helper now supports setting a variable to another value passed as an additional argument, rather than just a body

## 1.5.0

### Minor Changes

- 18ff6da: Support new FILE schema type

### Patch Changes

- 506c9be: Use pnpm 9 and workspace uris
- a5c7d64: Update templates for changes to multipart file properties to no longer contain metadata generated in core. If we want to bring back metadata in a generator template we'll need to add a specific FILE type to store that.
- 6d43eca: Update to node 20 and upgrade dependencies
- 5790781: Add CodegenContent type checking Handlebars helpers
- 2f86851: Update openapi-generator-plus upstream
- Updated dependencies [2f86851]
  - @openapi-generator-plus/generator-common@1.4.1

## 1.4.0

### Minor Changes

- 26c8e2bd: Fix handling of catch-all responses

### Patch Changes

- Updated dependencies [26c8e2bd]
  - @openapi-generator-plus/generator-common@1.4.0

## 1.3.5

### Patch Changes

- bc8647d6: Update core
- Updated dependencies [bc8647d6]
  - @openapi-generator-plus/generator-common@1.3.9

## 1.3.4

### Patch Changes

- 9b87ba44: Update core
- Updated dependencies [9b87ba44]
  - @openapi-generator-plus/generator-common@1.3.8

## 1.3.3

### Patch Changes

- cc2bb308: Update core types
- Updated dependencies [cc2bb308]
  - @openapi-generator-plus/generator-common@1.3.7

## 1.3.2

### Patch Changes

- 81de680: Update to latest core types
- Updated dependencies [81de680]
  - @openapi-generator-plus/generator-common@1.3.6

## 1.3.1

### Patch Changes

- d41da8d: Upgrade core types
- b6d16d9: Update dependencies
- 1f8b503: Improve "caused by" stack trace from handlebars templates
- Updated dependencies [d41da8d]
- Updated dependencies [b6d16d9]
  - @openapi-generator-plus/generator-common@1.3.5

## 1.3.0

### Minor Changes

- 8c9c533: Update third party dependencies

### Patch Changes

- Updated dependencies [59c2ca9]
  - @openapi-generator-plus/generator-common@1.3.4

## 1.2.4

### Patch Changes

- da518bb: Update core types
- Updated dependencies [da518bb]
  - @openapi-generator-plus/generator-common@1.3.3

## 1.2.3

### Patch Changes

- 5601ab5: Support illegal identifiers in model interfaces

## 1.2.2

### Patch Changes

- 9732cd1: Update core to 2.3.0
- Updated dependencies [9732cd1]
  - @openapi-generator-plus/generator-common@1.3.2

## 1.2.1

### Patch Changes

- 691f556: Update core to 2.2.0
- Updated dependencies [691f556]
  - @openapi-generator-plus/generator-common@1.3.1

## 1.2.0

### Minor Changes

- db48add: Upgrade core types to 2.1.0 to return the `initialValue` function removed incorrectly in 2.0.0

### Patch Changes

- Updated dependencies [db48add]
  - @openapi-generator-plus/generator-common@1.3.0

## 1.1.4

### Patch Changes

- 19a8994: Update @openapi-generator-plus/core to 2.0.0

  _Note_ Please check the changelog for Java generators for breaking changes to the default values in generated model classes.

- Updated dependencies [19a8994]
- Updated dependencies [0664881]
  - @openapi-generator-plus/generator-common@1.2.0

## 1.1.3

### Patch Changes

- 072fe50: Fix handling of Windows newlines in join and indent helpers

## 1.1.2

### Patch Changes

- 4ea4845: Tidy dependencies on @openapi-generator-plus core modules
- cab735b: Upgrade dependencies
- Updated dependencies [4ea4845]
  - @openapi-generator-plus/generator-common@1.1.2

## 1.1.1

### Patch Changes

- feed9d5: Update @openapi-generator-plus/core to 1.5.0
- Updated dependencies [feed9d5]
  - @openapi-generator-plus/generator-common@1.1.1

## 1.1.0

### Minor Changes

- be034fb: Upgrade @openapi-generator-plus/core

### Patch Changes

- cb18c75: Upgrade dependencies
- Updated dependencies [be034fb]
- Updated dependencies [cb18c75]
  - @openapi-generator-plus/generator-common@1.1.0

## 1.0.0

### Major Changes

- 63e4795: Upgrade core to 1.0.0
- 8717cfb: First major release

### Patch Changes

- Updated dependencies [63e4795]
- Updated dependencies [8717cfb]
  - @openapi-generator-plus/generator-common@1.0.0

## 0.27.2

### Patch Changes

- 81f05fa: Fix ifeg helper to correctly detect the presence of examples with a falsy value
- fabe1ac: Fix ifvex helper to correctly detect the presence of vendor extensions with a falsy value

## 0.27.1

### Patch Changes

- 1109255: Use uniquePropertiesIncludingInherited from core
- Updated dependencies [a16fa0b]
- Updated dependencies [1109255]
  - @openapi-generator-plus/generator-common@0.26.0

## 0.27.0

### Minor Changes

- 23171d5: Add count, gt, ge, lt, le helpers

## 0.26.1

### Patch Changes

- b45576a: Update package.json metadata to include better homepage URLs
- Updated dependencies [51206bb]
- Updated dependencies [b45576a]
  - @openapi-generator-plus/generator-common@0.25.1

## 0.26.0

### Minor Changes

- 630ba24: Support new CodegenSchemaType.HIERARCHY
- 0cfd306: Upgrade to core 0.41.0

### Patch Changes

- 25a8ab6: Add debugStringify to improve logging of objects
- Updated dependencies [e74d3ef]
- Updated dependencies [25a8ab6]
- Updated dependencies [0cfd306]
  - @openapi-generator-plus/generator-common@0.25.0

## 0.25.0

### Minor Changes

- ad19364: Upgrade to core 0.40.0

### Patch Changes

- e72fec6: Fixes for core changes including CodegenSchemaUsage decoupling
- a2ae651: Fix property type helpers now that we don't have type info in CodegenContent and CodegenRequestBody
- Updated dependencies [ad19364]
  - @openapi-generator-plus/generator-common@0.24.0

## 0.24.0

### Minor Changes

- ff4ee4f: Fixes for toLiteral and defaultValue being able to return null

### Patch Changes

- Updated dependencies [2f5e239]
  - @openapi-generator-plus/generator-common@0.23.0

## 0.23.0

### Minor Changes

- 135a732: Update for core discriminator changes and additional generator options

### Patch Changes

- 26e7810: Fix helpers that convert to strings when receiving a null
- Updated dependencies [135a732]
- Updated dependencies [24823f9]
  - @openapi-generator-plus/generator-common@0.22.0

## 0.22.0

### Minor Changes

- fa0f593: Upgrade core

### Patch Changes

- Updated dependencies [fa0f593]
  - @openapi-generator-plus/generator-common@0.21.0

## 0.21.0

### Minor Changes

- b5ad150: Upgrade core

### Patch Changes

- Updated dependencies [b5ad150]
  - @openapi-generator-plus/generator-common@0.20.0

## 0.20.1

### Patch Changes

- 6c1300d: Expand stringLiteral to support numeric and other types that we want to turn into strings

## 0.20.0

### Minor Changes

- 6f81fa5: ifvex helper can now accept an object as its second argument to look for vendor extensions in that object, rather than just a property name to lookup relative to the current context
- c34292b: Update to core 0.35.0

### Patch Changes

- Updated dependencies [c34292b]
  - @openapi-generator-plus/generator-common@0.19.0

## 0.19.1

### Patch Changes

- cc30b0d: Add an isWrapper helper

## 0.19.0

### Minor Changes

- 7a86b15: Add logging helpers
- ee03854: Core update

### Patch Changes

- Updated dependencies [ee03854]
  - @openapi-generator-plus/generator-common@0.18.0

## 0.18.0

### Minor Changes

- a84fd09: Add an indent helper to help format JavaDoc-style documentation
- 60f75a9: Add an allProperties helper

## 0.17.1

### Patch Changes

- a65b3ce: Upgrade dependencies
- Updated dependencies [a65b3ce]
  - @openapi-generator-plus/generator-common@0.17.1

## 0.17.0

### Minor Changes

- 86c4e5d: Support the allOf, anyOf, oneOf handling changes in core.

### Patch Changes

- 05d3c03: Changed from lerna to pnpm for monorepo management, and changesets for releases and versioning
- Updated dependencies [05d3c03]
- Updated dependencies [86c4e5d]
  - @openapi-generator-plus/generator-common@0.17.0
