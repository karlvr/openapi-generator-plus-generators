# @openapi-generator-plus/template-utils

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
