---
"@openapi-generator-plus/template-utils": minor
"@openapi-generator-plus/typescript-generator-common": major
"@openapi-generator-plus/typescript-fetch-client-generator": major
"@openapi-generator-plus/typescript-fetch-client-generator2": major
"@openapi-generator-plus/typescript-fetch-node-client-generator": major
"@openapi-generator-plus/typescript-fetch-node-client-generator2": major
"@openapi-generator-plus/typescript-fetch-rn-client-generator": major
"@openapi-generator-plus/typescript-express-example-server-generator": major
"@openapi-generator-plus/plain-documentation-generator": major
"@openapi-generator-plus/java-jaxrs-generator-common": major
"@openapi-generator-plus/java-jaxrs-client-generator": major
"@openapi-generator-plus/java-jaxrs-server-generator": major
"@openapi-generator-plus/java-cxf-client-generator": major
"@openapi-generator-plus/java-cxf-cdi-server-generator": major
"@openapi-generator-plus/java-cxf-spring-server-generator": major
"@openapi-generator-plus/java-retrofit-client-generator": major
---

Replace Handlebars templates with TypeScript templates across every generator.

Templates are now TypeScript code built on the new
`@openapi-generator-plus/template-utils` package (the `ts` tagged template with
SKIP/when/maybe/each/join helpers), giving template development type-safety
against the codegen document model, ordinary code navigation and refactoring,
and testability. Generated output is byte-identical to the previous Handlebars
output (trailing whitespace on a line is no longer emitted), verified across
every generator's full test-spec corpus during the migration.

Breaking changes:

- The `customTemplates` config option is removed. Templates are TypeScript
  code; generators are customized through their typed template and hook APIs
  (for example `FetchClientHooks` in the fetch client generators, the
  `JavaJaxrsTemplates` hook bag in the Java family, and
  `PlainDocumentationHooks` in plain-documentation). Setting `customTemplates`
  now logs a warning and has no effect.
- The Handlebars-based extension hooks are removed from the shared generator
  contexts: `loadAdditionalTemplates`, `additionalWatchPaths` and
  `additionalExportTemplates` in `typescript-generator-common` and
  `java-jaxrs-generator-common`. Child generators supply typed templates via
  the context `templates` bag and emit extra files via `exportFiles`.
- The `handlebars` and `@openapi-generator-plus/handlebars-templates`
  dependencies are dropped from all of these packages.

Fixes:

- typescript-fetch-client: with `withInterfaces`, generated `…ApiInterface`
  methods now declare the request-body parameter, so the generated classes
  compile against their interfaces.
- typescript-fetch-rn-client: generated `package.json` no longer contains a
  trailing comma in `dependencies` (previously invalid JSON unless a
  `blind-date` dependency followed).
- java-jaxrs-server: group-level `@Consumes`/`@Produces` annotations render
  the media type instead of `[object Object]`.
- java-retrofit-client: the generator works again (its `pom.hbs` had an
  unclosed block and `api.hbs` failed for operations without nested schemas);
  parameters that Retrofit has no annotation for (cookies) are omitted instead
  of leaving stray `,` separators; the pom's `<configuration>` open tag is
  well-formed and `lombok.version` is declared when `useLombok` is set.
- java-cxf-cdi-server: the junit-jupiter version honours
  `maven.versions.junit_jupiter` instead of always using 5.7.2.
- java-cxf-spring-server: the junit-bom dependency entry is only emitted when
  `includeTests` is set, matching the property it references.
