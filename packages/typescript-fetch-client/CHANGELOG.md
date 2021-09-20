# @openapi-generator-plus/typescript-fetch-client-generator

## 0.29.1

### Patch Changes

- Updated dependencies [b5ad150]
  - @openapi-generator-plus/generator-common@0.20.0
  - @openapi-generator-plus/handlebars-templates@0.21.0
  - @openapi-generator-plus/typescript-generator-common@0.22.5

## 0.29.0

### Minor Changes

- 83a47f4: Update blind-date to 3.2.0 to fix timestamp regex bug

### Patch Changes

- cb453ba: Fix missing includePolyfills check around the import of whatwg-fetch
- Updated dependencies [6c1300d]
  - @openapi-generator-plus/handlebars-templates@0.20.1

## 0.28.0

### Minor Changes

- 419828e: Improve parameter serialization including removing x-serialize-nested-as-json vendor extension and making that the default (as that's what editor.swagger.io) does, fixing serialization of header parameters
- 742a47d: Add support for readOnly and writeOnly properties
- 15d56ca: Add support for cookie params

  Note that this doesn't work in browser API clients, see https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_header_name

## 0.27.0

### Minor Changes

- 38d4257: Support x-serialize-nested-as-json on CodegenParameter to serialize nested items as JSON

### Patch Changes

- 37478df: Fix the serializedName of a property not being correctly used when serializing an object in a parameter
- Updated dependencies [6f81fa5]
- Updated dependencies [c34292b]
- Updated dependencies [cdc41e6]
  - @openapi-generator-plus/handlebars-templates@0.20.0
  - @openapi-generator-plus/generator-common@0.19.0
  - @openapi-generator-plus/typescript-generator-common@0.22.4

## 0.26.0

### Minor Changes

- a6146f6: Add a configuration option to exclude polyfills

## 0.25.1

### Patch Changes

- 7c50b17: Log warnings for unsupported encoding styles
- Updated dependencies [7a86b15]
- Updated dependencies [ee03854]
  - @openapi-generator-plus/handlebars-templates@0.19.0
  - @openapi-generator-plus/generator-common@0.18.0
  - @openapi-generator-plus/typescript-generator-common@0.22.2

## 0.25.0

### Minor Changes

- 9f6ef06: Support parameter serializedName and fix more object serializedName cases

### Patch Changes

- 9dbd093: Fix x-www-form-urlencoded body handling

  I left in the old code after the previous upgrade to respect encodings.

- 83cde2b: Correctly handle object properties that have a different serialized name

## 0.24.0

### Minor Changes

- 68cc337: Add support for parameter encoding styles for parameters and x-www-form-urlencoded bodies
- bab3808: Documentation improvements and externalDocs support

  I've removed some of the @ annotations in the documentation that I didn't think were still useful
  in a TypeScript world. I hope that was correct.

### Patch Changes

- Updated dependencies [a84fd09]
- Updated dependencies [04d59a7]
- Updated dependencies [60f75a9]
  - @openapi-generator-plus/handlebars-templates@0.18.0
  - @openapi-generator-plus/typescript-generator-common@0.22.1

## 0.23.1

### Patch Changes

- a65b3ce: Upgrade dependencies
- Updated dependencies [a65b3ce]
  - @openapi-generator-plus/generator-common@0.17.1
  - @openapi-generator-plus/handlebars-templates@0.17.1

## 0.23.0

### Minor Changes

- 86c4e5d: Support the allOf, anyOf, oneOf handling changes in core.

### Patch Changes

- 05d3c03: Changed from lerna to pnpm for monorepo management, and changesets for releases and versioning
- Updated dependencies [05d3c03]
- Updated dependencies [86c4e5d]
  - @openapi-generator-plus/generator-common@0.17.0
  - @openapi-generator-plus/handlebars-templates@0.17.0
  - @openapi-generator-plus/typescript-generator-common@0.22.0
