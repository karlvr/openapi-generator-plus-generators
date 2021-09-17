# @openapi-generator-plus/java-jaxrs-server-generator

## 0.35.0

### Minor Changes

- 6c1300d: Validation enhanced to support asymmetric validation for when a readOnly or writeOnly is present

### Patch Changes

- Updated dependencies [6c1300d]
- Updated dependencies [6c1300d]
  - @openapi-generator-plus/handlebars-templates@0.20.1
  - @openapi-generator-plus/java-jaxrs-generator-common@0.31.0

## 0.34.0

### Minor Changes

- b9878c8: Add support for cookie params
- 742a47d: Add support for readOnly and writeOnly properties

### Patch Changes

- Updated dependencies [b9878c8]
- Updated dependencies [742a47d]
  - @openapi-generator-plus/java-jaxrs-generator-common@0.30.0

## 0.33.3

### Patch Changes

- Updated dependencies [6f81fa5]
- Updated dependencies [c34292b]
  - @openapi-generator-plus/handlebars-templates@0.20.0
  - @openapi-generator-plus/generator-common@0.19.0
  - @openapi-generator-plus/java-jaxrs-generator-common@0.29.1
  - @openapi-generator-plus/java-like-generator-helper@0.15.3

## 0.33.2

### Patch Changes

- Updated dependencies [48c6e39]
- Updated dependencies [cc30b0d]
  - @openapi-generator-plus/java-jaxrs-generator-common@0.29.0
  - @openapi-generator-plus/handlebars-templates@0.19.1

## 0.33.1

### Patch Changes

- Updated dependencies [7a86b15]
- Updated dependencies [ee03854]
  - @openapi-generator-plus/handlebars-templates@0.19.0
  - @openapi-generator-plus/generator-common@0.18.0
  - @openapi-generator-plus/java-jaxrs-generator-common@0.28.1
  - @openapi-generator-plus/java-like-generator-helper@0.15.2

## 0.33.0

### Minor Changes

- 9f6ef06: Support parameter serializedName and fix more object serializedName cases

## 0.32.0

### Minor Changes

- 8ec0d91: Support externalDocs on operations and pojos, and improve documentation formatting

  We now apply the markdown formatting in all JavaDoc comments. They're supposed to be HTML
  and IDEs expect them to be HTML formatted, so it improves the display in the IDE.

### Patch Changes

- Updated dependencies [a84fd09]
- Updated dependencies [dcd7e17]
- Updated dependencies [04d59a7]
- Updated dependencies [60f75a9]
- Updated dependencies [8ec0d91]
  - @openapi-generator-plus/handlebars-templates@0.18.0
  - @openapi-generator-plus/java-jaxrs-generator-common@0.28.0

## 0.31.1

### Patch Changes

- a65b3ce: Upgrade dependencies
- Updated dependencies [a65b3ce]
- Updated dependencies [0116337]
  - @openapi-generator-plus/generator-common@0.17.1
  - @openapi-generator-plus/handlebars-templates@0.17.1
  - @openapi-generator-plus/java-jaxrs-generator-common@0.27.1
  - @openapi-generator-plus/java-like-generator-helper@0.15.1

## 0.31.0

### Minor Changes

- 86c4e5d: Support the allOf, anyOf, oneOf handling changes in core.

### Patch Changes

- 05d3c03: Changed from lerna to pnpm for monorepo management, and changesets for releases and versioning
- Updated dependencies [05d3c03]
- Updated dependencies [86c4e5d]
  - @openapi-generator-plus/generator-common@0.17.0
  - @openapi-generator-plus/handlebars-templates@0.17.0
  - @openapi-generator-plus/java-jaxrs-generator-common@0.27.0
  - @openapi-generator-plus/java-like-generator-helper@0.15.0
