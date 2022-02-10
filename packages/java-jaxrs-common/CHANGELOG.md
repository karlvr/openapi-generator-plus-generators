# @openapi-generator-plus/java-jaxrs-generator-common

## 1.1.0

### Minor Changes

- 38b8995: Validation: unwrap java.util.Optional to apply validation to the wrapped value

## 1.0.2

### Patch Changes

- d96304c: Fix infinite loop from previous change

## 1.0.1

### Patch Changes

- a7f4840: Fix incorrect overriding method signature when superclass has a property using java.util.Optional

## 1.0.0

### Major Changes

- 8717cfb: First major release

### Patch Changes

- Updated dependencies [63e4795]
- Updated dependencies [8717cfb]
  - @openapi-generator-plus/generator-common@1.0.0
  - @openapi-generator-plus/handlebars-templates@1.0.0
  - @openapi-generator-plus/java-like-generator-helper@1.0.0

## 0.36.0

### Minor Changes

- b6297ef: Rename putAdditionalProperty method to put

### Patch Changes

- efaea2a: Add a vendor extension to override Jackson's JsonTypeInfo#use option
- Updated dependencies [a16fa0b]
- Updated dependencies [1109255]
  - @openapi-generator-plus/generator-common@0.26.0
  - @openapi-generator-plus/handlebars-templates@0.27.1
  - @openapi-generator-plus/java-like-generator-helper@0.16.4

## 0.35.0

### Minor Changes

- f99980e: Add property documentation to getter in addition to fluent getter

## 0.34.2

### Patch Changes

- 15dc644: Remove defunct serialVersionUID static finals that should have been removed when java.io.Serializable was removed

## 0.34.1

### Patch Changes

- Updated dependencies [23171d5]
  - @openapi-generator-plus/handlebars-templates@0.27.0

## 0.34.0

### Minor Changes

- 3592e5a: Remove `java.io.Serializable` from models [#28]

  We use `java.util.Optional` which isn't serializable.

### Patch Changes

- 8558822: Add a config option for the binary data representation to use
- 0cc86ee: Fix enum literals where the enum property isn't required

## 0.33.5

### Patch Changes

- 2e840bb: Standardise on OpenAPI Generator Plus instead of OpenAPI Generator+

## 0.33.4

### Patch Changes

- 28e4e3b: Standardise terminology from generator module to generator template

## 0.33.3

### Patch Changes

- b45576a: Update package.json metadata to include better homepage URLs
- Updated dependencies [51206bb]
- Updated dependencies [b45576a]
  - @openapi-generator-plus/generator-common@0.25.1
  - @openapi-generator-plus/handlebars-templates@0.26.1
  - @openapi-generator-plus/java-like-generator-helper@0.16.3

## 0.33.2

### Patch Changes

- fc32aaf: Fix initial value for a property in the case of nullable / optionals
- 25a8ab6: Add debugStringify to improve logging of objects
- Updated dependencies [630ba24]
- Updated dependencies [e74d3ef]
- Updated dependencies [25a8ab6]
- Updated dependencies [0cfd306]
  - @openapi-generator-plus/handlebars-templates@0.26.0
  - @openapi-generator-plus/generator-common@0.25.0
  - @openapi-generator-plus/java-like-generator-helper@0.16.2

## 0.33.1

### Patch Changes

- e72fec6: Fixes for core changes including CodegenSchemaUsage decoupling
- 9afa386: Improve error messages when types are incorrect
- Updated dependencies [e72fec6]
- Updated dependencies [ad19364]
- Updated dependencies [a2ae651]
  - @openapi-generator-plus/handlebars-templates@0.25.0
  - @openapi-generator-plus/generator-common@0.24.0
  - @openapi-generator-plus/java-like-generator-helper@0.16.1

## 0.33.0

### Minor Changes

- ff4ee4f: Fixes for toLiteral and defaultValue being able to return null
- 10aeb32: Fixes for CodegenRequestBody.nativeType changing to nullable
- 9c992d5: Fixes for CodegenConfig changing to having unknown values
- 11b32c0: No longer need to check for nullable parameters due to core change

### Patch Changes

- Updated dependencies [60ef5fe]
- Updated dependencies [ff4ee4f]
- Updated dependencies [20967c4]
- Updated dependencies [2f5e239]
- Updated dependencies [9c992d5]
  - @openapi-generator-plus/java-like-generator-helper@0.16.0
  - @openapi-generator-plus/handlebars-templates@0.24.0
  - @openapi-generator-plus/generator-common@0.23.0

## 0.32.0

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

## 0.31.2

### Patch Changes

- Updated dependencies [fa0f593]
  - @openapi-generator-plus/generator-common@0.21.0
  - @openapi-generator-plus/handlebars-templates@0.22.0
  - @openapi-generator-plus/java-like-generator-helper@0.15.6

## 0.31.1

### Patch Changes

- Updated dependencies [b5ad150]
  - @openapi-generator-plus/generator-common@0.20.0
  - @openapi-generator-plus/handlebars-templates@0.21.0
  - @openapi-generator-plus/java-like-generator-helper@0.15.5

## 0.31.0

### Minor Changes

- 6c1300d: Validation enhanced to support asymmetric validation for when a readOnly or writeOnly is present

### Patch Changes

- Updated dependencies [6c1300d]
  - @openapi-generator-plus/handlebars-templates@0.20.1

## 0.30.1

### Patch Changes

- 3e9eda3: Fix setting nullable properties to null when using java.util.Optional
- Updated dependencies [72a3bbc]
  - @openapi-generator-plus/java-like-generator-helper@0.15.4

## 0.30.0

### Minor Changes

- b9878c8: Add support for cookie params
- 742a47d: Add support for readOnly and writeOnly properties

## 0.29.1

### Patch Changes

- Updated dependencies [6f81fa5]
- Updated dependencies [c34292b]
  - @openapi-generator-plus/handlebars-templates@0.20.0
  - @openapi-generator-plus/generator-common@0.19.0
  - @openapi-generator-plus/java-like-generator-helper@0.15.3

## 0.29.0

### Minor Changes

- 48c6e39: Add support for CodegenWrapperSchema to support wrapping primitives

### Patch Changes

- Updated dependencies [cc30b0d]
  - @openapi-generator-plus/handlebars-templates@0.19.1

## 0.28.1

### Patch Changes

- Updated dependencies [7a86b15]
- Updated dependencies [ee03854]
  - @openapi-generator-plus/handlebars-templates@0.19.0
  - @openapi-generator-plus/generator-common@0.18.0
  - @openapi-generator-plus/java-like-generator-helper@0.15.2

## 0.28.0

### Minor Changes

- dcd7e17: Add JsonTypeInfo.Id.DEDUCTION when there is no discriminator
- 8ec0d91: Support externalDocs on operations and pojos, and improve documentation formatting

  We now apply the markdown formatting in all JavaDoc comments. They're supposed to be HTML
  and IDEs expect them to be HTML formatted, so it improves the display in the IDE.

### Patch Changes

- 04d59a7: Fix date and time native types

  This was broken in the previous release in the TypeScript generator, and generating dates and times in
  parameters would have failed.

- Updated dependencies [a84fd09]
- Updated dependencies [60f75a9]
  - @openapi-generator-plus/handlebars-templates@0.18.0

## 0.27.1

### Patch Changes

- a65b3ce: Upgrade dependencies
- 0116337: Omit property javadoc comment if there's nothing to say
- Updated dependencies [a65b3ce]
  - @openapi-generator-plus/generator-common@0.17.1
  - @openapi-generator-plus/handlebars-templates@0.17.1
  - @openapi-generator-plus/java-like-generator-helper@0.15.1

## 0.27.0

### Minor Changes

- 86c4e5d: Support the allOf, anyOf, oneOf handling changes in core.

### Patch Changes

- 05d3c03: Changed from lerna to pnpm for monorepo management, and changesets for releases and versioning
- Updated dependencies [05d3c03]
- Updated dependencies [86c4e5d]
  - @openapi-generator-plus/generator-common@0.17.0
  - @openapi-generator-plus/handlebars-templates@0.17.0
  - @openapi-generator-plus/java-like-generator-helper@0.15.0
