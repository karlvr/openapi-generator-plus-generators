# @openapi-generator-plus/handlebars-templates

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
