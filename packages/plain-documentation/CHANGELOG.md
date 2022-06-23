# @openapi-generator-plus/plain-documentation-generator

## 1.1.0

### Minor Changes

- 87bd6b5: Core has removed `initialValue` from the generator and renamed the `CodegenProperty` member to `defaultValue`

  The behaviour of the new `defaultValue` is significantly different to the old `initialValue`. Previously any
  _required_ property would have a non-null initial value; in Java generators this resulted in a default value
  non-null value for many properties in generated module objects.

  _NOTE_: For generated Java models some properties may be `null` where they previously had values when the object was constructed. Please check any
  differences in your generated code and check that your code won't cause a `NullPointerException` at runtime, such as if calling
  `model.getArrayProperty().add(value)`, assuming that `arrayProperty` will be non-null. Instead change to `model.arrayProperty().add(value)` or
  `model.addArrayProperty(value)`.

### Patch Changes

- 19a8994: Update @openapi-generator-plus/core to 2.0.0

  _Note_ Please check the changelog for Java generators for breaking changes to the default values in generated model classes.

- Updated dependencies [19a8994]
- Updated dependencies [0664881]
  - @openapi-generator-plus/java-like-generator-helper@2.0.0
  - @openapi-generator-plus/generator-common@1.2.0
  - @openapi-generator-plus/handlebars-templates@1.1.4

## 1.0.2

### Patch Changes

- Updated dependencies [072fe50]
  - @openapi-generator-plus/handlebars-templates@1.1.3

## 1.0.1

### Patch Changes

- 4ea4845: Tidy dependencies on @openapi-generator-plus core modules
- Updated dependencies [4ea4845]
- Updated dependencies [cab735b]
  - @openapi-generator-plus/generator-common@1.1.2
  - @openapi-generator-plus/handlebars-templates@1.1.2
  - @openapi-generator-plus/java-like-generator-helper@1.0.1

## 1.0.0

### Major Changes

- 8717cfb: First major release

### Patch Changes

- Updated dependencies [63e4795]
- Updated dependencies [8717cfb]
  - @openapi-generator-plus/generator-common@1.0.0
  - @openapi-generator-plus/handlebars-templates@1.0.0
  - @openapi-generator-plus/java-like-generator-helper@1.0.0

## 0.20.7

### Patch Changes

- Updated dependencies [a16fa0b]
- Updated dependencies [1109255]
  - @openapi-generator-plus/generator-common@0.26.0
  - @openapi-generator-plus/handlebars-templates@0.27.1
  - @openapi-generator-plus/java-like-generator-helper@0.16.4

## 0.20.6

### Patch Changes

- Updated dependencies [23171d5]
  - @openapi-generator-plus/handlebars-templates@0.27.0

## 0.20.5

### Patch Changes

- 2e840bb: Standardise on OpenAPI Generator Plus instead of OpenAPI Generator+

## 0.20.4

### Patch Changes

- 28e4e3b: Standardise terminology from generator module to generator template

## 0.20.3

### Patch Changes

- b45576a: Update package.json metadata to include better homepage URLs
- Updated dependencies [51206bb]
- Updated dependencies [b45576a]
  - @openapi-generator-plus/generator-common@0.25.1
  - @openapi-generator-plus/handlebars-templates@0.26.1
  - @openapi-generator-plus/java-like-generator-helper@0.16.3

## 0.20.2

### Patch Changes

- Updated dependencies [630ba24]
- Updated dependencies [e74d3ef]
- Updated dependencies [25a8ab6]
- Updated dependencies [0cfd306]
  - @openapi-generator-plus/handlebars-templates@0.26.0
  - @openapi-generator-plus/generator-common@0.25.0
  - @openapi-generator-plus/java-like-generator-helper@0.16.2

## 0.20.1

### Patch Changes

- e72fec6: Fixes for core changes including CodegenSchemaUsage decoupling
- Updated dependencies [e72fec6]
- Updated dependencies [ad19364]
- Updated dependencies [a2ae651]
  - @openapi-generator-plus/handlebars-templates@0.25.0
  - @openapi-generator-plus/generator-common@0.24.0
  - @openapi-generator-plus/java-like-generator-helper@0.16.1

## 0.20.0

### Minor Changes

- ff4ee4f: Fixes for toLiteral and defaultValue being able to return null
- 9c992d5: Fixes for CodegenConfig changing to having unknown values

### Patch Changes

- Updated dependencies [60ef5fe]
- Updated dependencies [ff4ee4f]
- Updated dependencies [20967c4]
- Updated dependencies [2f5e239]
- Updated dependencies [9c992d5]
  - @openapi-generator-plus/java-like-generator-helper@0.16.0
  - @openapi-generator-plus/handlebars-templates@0.24.0
  - @openapi-generator-plus/generator-common@0.23.0

## 0.19.0

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

## 0.18.1

### Patch Changes

- Updated dependencies [fa0f593]
  - @openapi-generator-plus/generator-common@0.21.0
  - @openapi-generator-plus/handlebars-templates@0.22.0
  - @openapi-generator-plus/java-like-generator-helper@0.15.6

## 0.18.0

### Minor Changes

- 6100cd1: Improve discriminator to show discriminator property information
- c79b56b: Improve nested schema rendering, especially for allOf

### Patch Changes

- 8437d28: Improve display of composed types
- Updated dependencies [b5ad150]
  - @openapi-generator-plus/generator-common@0.20.0
  - @openapi-generator-plus/handlebars-templates@0.21.0
  - @openapi-generator-plus/java-like-generator-helper@0.15.5

## 0.17.1

### Patch Changes

- Updated dependencies [6f81fa5]
- Updated dependencies [c34292b]
  - @openapi-generator-plus/handlebars-templates@0.20.0
  - @openapi-generator-plus/generator-common@0.19.0
  - @openapi-generator-plus/java-like-generator-helper@0.15.3

## 0.17.0

### Minor Changes

- 29e9f5a: Fix the handling of anonymous schemas, such as those created for inline request bodies and responses. Before the recent core upgrade they appeared in the definitions along with all of the other schemas. After the recent core upgrade they didn't appear at all. Now they appear inline with the operation that uses them.

## 0.16.2

### Patch Changes

- Updated dependencies [7a86b15]
- Updated dependencies [ee03854]
  - @openapi-generator-plus/handlebars-templates@0.19.0
  - @openapi-generator-plus/generator-common@0.18.0
  - @openapi-generator-plus/java-like-generator-helper@0.15.2

## 0.16.1

### Patch Changes

- Updated dependencies [a84fd09]
- Updated dependencies [60f75a9]
  - @openapi-generator-plus/handlebars-templates@0.18.0

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
