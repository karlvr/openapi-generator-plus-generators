# @openapi-generator-plus/java-like-generator-helper

## 2.6.0

### Minor Changes

- 366ada5: Add `enumMemberStyle` option with new `preserve` option

  The actual naming of the enum members can be really important. We default to the old behaviour, which is to name the enum members according
  to the preferred constant style of the language being generated, but we now add an option to try to preserve the enum member names from the
  API spec. Preserving is important if you use the enum member names in code such as by serializing them or matching them by their string names,
  e.g. Java's `EnumType.valueOf(String)`.

### Patch Changes

- 601553e: Update core
- Updated dependencies [601553e]
  - @openapi-generator-plus/generator-common@1.7.1

## 2.5.0

### Minor Changes

- 382b02c: Bump core version and now explicitly depend upon core

### Patch Changes

- Updated dependencies [382b02c]
  - @openapi-generator-plus/generator-common@1.7.0

## 2.4.1

### Patch Changes

- Updated dependencies [2685ee7]
  - @openapi-generator-plus/generator-common@1.6.1

## 2.4.0

### Minor Changes

- 054c84f: Add enumClassPrefix, enumClassSuffix, modelClassSuffix
- 5b78af2: Upgrade core
- 1fb923c: Add nestedModelClassPrefix and nestedEnumClassPrefix config options

### Patch Changes

- Updated dependencies [5b78af2]
  - @openapi-generator-plus/generator-common@1.6.0

## 2.3.0

### Minor Changes

- 9e1dc23: Update upstream

### Patch Changes

- Updated dependencies [9e1dc23]
  - @openapi-generator-plus/generator-common@1.5.0

## 2.2.1

### Patch Changes

- 506c9be: Use pnpm 9 and workspace uris
- 5c51b1d: Fixes for @openapi-generator-plus/types changes in CodegenSchemaPurpose
- 2f86851: Update openapi-generator-plus upstream
- Updated dependencies [2f86851]
  - @openapi-generator-plus/generator-common@1.4.1

## 2.2.0

### Minor Changes

- 26c8e2bd: Fix handling of catch-all responses

### Patch Changes

- Updated dependencies [26c8e2bd]
  - @openapi-generator-plus/generator-common@1.4.0

## 2.1.10

### Patch Changes

- bc8647d6: Update core
- Updated dependencies [bc8647d6]
  - @openapi-generator-plus/generator-common@1.3.9

## 2.1.9

### Patch Changes

- 9b87ba44: Update core
- Updated dependencies [9b87ba44]
  - @openapi-generator-plus/generator-common@1.3.8

## 2.1.8

### Patch Changes

- cc2bb308: Update core types
- Updated dependencies [cc2bb308]
  - @openapi-generator-plus/generator-common@1.3.7

## 2.1.7

### Patch Changes

- 81de680: Update to latest core types
- Updated dependencies [81de680]
  - @openapi-generator-plus/generator-common@1.3.6

## 2.1.6

### Patch Changes

- d41da8d: Upgrade core types
- b6d16d9: Update dependencies
- Updated dependencies [d41da8d]
- Updated dependencies [b6d16d9]
  - @openapi-generator-plus/generator-common@1.3.5

## 2.1.5

### Patch Changes

- Updated dependencies [59c2ca9]
  - @openapi-generator-plus/generator-common@1.3.4

## 2.1.4

### Patch Changes

- da518bb: Update core types
- Updated dependencies [da518bb]
  - @openapi-generator-plus/generator-common@1.3.3

## 2.1.3

### Patch Changes

- 5601ab5: Support illegal identifiers in model interfaces

## 2.1.2

### Patch Changes

- 9732cd1: Update core to 2.3.0
- Updated dependencies [9732cd1]
  - @openapi-generator-plus/generator-common@1.3.2

## 2.1.1

### Patch Changes

- 691f556: Update core to 2.2.0
- Updated dependencies [691f556]
  - @openapi-generator-plus/generator-common@1.3.1

## 2.1.0

### Minor Changes

- db48add: Upgrade core types to 2.1.0 to return the `initialValue` function removed incorrectly in 2.0.0

### Patch Changes

- Updated dependencies [db48add]
  - @openapi-generator-plus/generator-common@1.3.0

## 2.0.0

### Major Changes

- 19a8994: Update @openapi-generator-plus/core to 2.0.0

  _Note_ Please check the changelog for Java generators for breaking changes to the default values in generated model classes.

### Patch Changes

- Updated dependencies [19a8994]
- Updated dependencies [0664881]
  - @openapi-generator-plus/generator-common@1.2.0

## 1.0.1

### Patch Changes

- 4ea4845: Tidy dependencies on @openapi-generator-plus core modules
- Updated dependencies [4ea4845]
  - @openapi-generator-plus/generator-common@1.1.2

## 1.0.0

### Major Changes

- 8717cfb: First major release

### Patch Changes

- Updated dependencies [63e4795]
- Updated dependencies [8717cfb]
  - @openapi-generator-plus/generator-common@1.0.0

## 0.16.4

### Patch Changes

- Updated dependencies [a16fa0b]
- Updated dependencies [1109255]
  - @openapi-generator-plus/generator-common@0.26.0

## 0.16.3

### Patch Changes

- b45576a: Update package.json metadata to include better homepage URLs
- Updated dependencies [51206bb]
- Updated dependencies [b45576a]
  - @openapi-generator-plus/generator-common@0.25.1

## 0.16.2

### Patch Changes

- Updated dependencies [e74d3ef]
- Updated dependencies [25a8ab6]
- Updated dependencies [0cfd306]
  - @openapi-generator-plus/generator-common@0.25.0

## 0.16.1

### Patch Changes

- Updated dependencies [ad19364]
  - @openapi-generator-plus/generator-common@0.24.0

## 0.16.0

### Minor Changes

- 20967c4: Support reserved words in constant names
- 9c992d5: Fixes for CodegenConfig changing to having unknown values

### Patch Changes

- 60ef5fe: Remove added trailing underscores from identifiers
- Updated dependencies [2f5e239]
  - @openapi-generator-plus/generator-common@0.23.0

## 0.15.7

### Patch Changes

- d4e4122: Support reserved words for class names
- Updated dependencies [135a732]
- Updated dependencies [24823f9]
  - @openapi-generator-plus/generator-common@0.22.0

## 0.15.6

### Patch Changes

- Updated dependencies [fa0f593]
  - @openapi-generator-plus/generator-common@0.21.0

## 0.15.5

### Patch Changes

- Updated dependencies [b5ad150]
  - @openapi-generator-plus/generator-common@0.20.0

## 0.15.4

### Patch Changes

- 72a3bbc: Fix modelClassPrefix for new schema types: interface, wrapper, allOf etc

## 0.15.3

### Patch Changes

- Updated dependencies [c34292b]
  - @openapi-generator-plus/generator-common@0.19.0

## 0.15.2

### Patch Changes

- Updated dependencies [ee03854]
  - @openapi-generator-plus/generator-common@0.18.0

## 0.15.1

### Patch Changes

- a65b3ce: Upgrade dependencies
- Updated dependencies [a65b3ce]
  - @openapi-generator-plus/generator-common@0.17.1

## 0.15.0

### Minor Changes

- 86c4e5d: Support the allOf, anyOf, oneOf handling changes in core.

### Patch Changes

- 05d3c03: Changed from lerna to pnpm for monorepo management, and changesets for releases and versioning
- Updated dependencies [05d3c03]
- Updated dependencies [86c4e5d]
  - @openapi-generator-plus/generator-common@0.17.0
