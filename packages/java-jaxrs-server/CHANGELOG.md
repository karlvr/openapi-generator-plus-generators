# @openapi-generator-plus/java-jaxrs-server-generator

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
