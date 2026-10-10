# @openapi-generator-plus/template-utils

## 0.3.1

### Patch Changes

- Updated dependencies [3e1cf09]
  - @openapi-generator-plus/generator-common@1.9.1

## 0.3.0

### Minor Changes

- f4e0291: Fix `Content-Type` header for `multipart/form-data` request bodies.

  We must allow `fetch` to automatically set the `Content-Type` header for `multipart/form-data` request bodies as it includes the `boundary` parameter from the `FormData`.

### Patch Changes

- Updated dependencies [446f067]
- Updated dependencies [189ecc2]
- Updated dependencies [c438203]
  - @openapi-generator-plus/generator-common@1.9.0

## 0.2.0

### Minor Changes

- Replace Handlebars templates with TypeScript templates across every generator.

  Templates are now TypeScript code built on the new
  `@openapi-generator-plus/template-utils` package (the `ts` tagged template with
  SKIP/when/maybe/each/join helpers), giving template development type-safety
  against the codegen document model, ordinary code navigation and refactoring,
  and testability. Generated output is byte-identical to the previous Handlebars
  output (trailing whitespace on a line is no longer emitted), verified across
  every generator's full test-spec corpus during the migration.

### Patch Changes

- Updated dependencies [ea76fa7]
  - @openapi-generator-plus/generator-common@1.8.1
