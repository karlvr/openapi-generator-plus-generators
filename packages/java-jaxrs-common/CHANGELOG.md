# @openapi-generator-plus/java-jaxrs-generator-common

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
