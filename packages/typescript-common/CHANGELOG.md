# @openapi-generator-plus/typescript-generator-common

## 0.23.0

### Minor Changes

- 5d3a6fe: Improve generated code for oneOf, allOf + discriminator etc

  Previously we converted all usages of a oneOf / allOf type to a disjunction. Now we only do
  that when the type isn't one that was named in the original spec. Now we leave the original
  type usage, as the original type is itself a disjunction and it's more expressive to use the
  original name.

  We also generate a new disjunction type for allOf + discriminator and use that when referring
  to the type, rather than using the disjunction everywhere. This makes the type easier to
  consume.

### Patch Changes

- Updated dependencies [fa0f593]
  - @openapi-generator-plus/generator-common@0.21.0
  - @openapi-generator-plus/handlebars-templates@0.22.0
  - @openapi-generator-plus/java-like-generator-helper@0.15.6

## 0.22.5

### Patch Changes

- Updated dependencies [b5ad150]
  - @openapi-generator-plus/generator-common@0.20.0
  - @openapi-generator-plus/handlebars-templates@0.21.0
  - @openapi-generator-plus/java-like-generator-helper@0.15.5

## 0.22.4

### Patch Changes

- cdc41e6: Support formatting object literals
- Updated dependencies [6f81fa5]
- Updated dependencies [c34292b]
  - @openapi-generator-plus/handlebars-templates@0.20.0
  - @openapi-generator-plus/generator-common@0.19.0
  - @openapi-generator-plus/java-like-generator-helper@0.15.3

## 0.22.3

### Patch Changes

- b4cbf98: Export the DateApproach type

## 0.22.2

### Patch Changes

- Updated dependencies [7a86b15]
- Updated dependencies [ee03854]
  - @openapi-generator-plus/handlebars-templates@0.19.0
  - @openapi-generator-plus/generator-common@0.18.0
  - @openapi-generator-plus/java-like-generator-helper@0.15.2

## 0.22.1

### Patch Changes

- 04d59a7: Fix date and time native types

  This was broken in the previous release in the TypeScript generator, and generating dates and times in
  parameters would have failed.

- Updated dependencies [a84fd09]
- Updated dependencies [60f75a9]
  - @openapi-generator-plus/handlebars-templates@0.18.0

## 0.22.0

### Minor Changes

- 86c4e5d: Support the allOf, anyOf, oneOf handling changes in core.

### Patch Changes

- 05d3c03: Changed from lerna to pnpm for monorepo management, and changesets for releases and versioning
- Updated dependencies [05d3c03]
- Updated dependencies [86c4e5d]
  - @openapi-generator-plus/generator-common@0.17.0
  - @openapi-generator-plus/handlebars-templates@0.17.0
  - @openapi-generator-plus/java-like-generator-helper@0.15.0
