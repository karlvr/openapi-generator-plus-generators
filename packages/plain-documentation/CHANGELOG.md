# @openapi-generator-plus/plain-documentation-generator

## 0.16.0

### Minor Changes

- 9b44278: Fix and greatly improve the generation of documentation for allOf, anyOf, oneOf

  We generate native allOf, anyOf and oneOf from core so we can now output documentation that is much
  closer to the original specification, rather than representing a conversion to an object hierarchy
  that is more specific to a language.

### Patch Changes

- 57d3b49: Fix extraneous type info in brackets on primitive types
- ac6ce17: Upgrade dependencies; less 4 deprecates strictMath false so more brackets in percentage(...)
- ac7ad2f: Fix anchor reference for object parents
- Updated dependencies [a65b3ce]
  - @openapi-generator-plus/generator-common@0.17.1
  - @openapi-generator-plus/handlebars-templates@0.17.1
  - @openapi-generator-plus/java-like-generator-helper@0.15.1

## 0.15.0

### Minor Changes

- 86c4e5d: Support the allOf, anyOf, oneOf handling changes in core.

### Patch Changes

- 05d3c03: Changed from lerna to pnpm for monorepo management, and changesets for releases and versioning
- Updated dependencies [05d3c03]
- Updated dependencies [86c4e5d]
  - @openapi-generator-plus/generator-common@0.17.0
  - @openapi-generator-plus/handlebars-templates@0.17.0
  - @openapi-generator-plus/java-like-generator-helper@0.15.0
