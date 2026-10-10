# @openapi-generator-plus/client-conformance

## 0.1.1

### Patch Changes

- 3e1cf09: Require a core that models `additionalProperties: true` and `{}` as a map of any values

  Core 2.33.0 is the first release that gives a generator the `any` schema type for the values of such
  a map. An earlier core gives it strings, so a generated client cannot hold a value such as a nested
  object.

  The dependency on the core now asks for 2.33.0, and the dependency on the testing package, which
  pins the core, asks for 2.33.0 too.

- Updated dependencies [3e1cf09]
  - @openapi-generator-plus/generator-common@1.9.1

## 0.1.0

### Minor Changes

- 5f9cc16: Publish the client conformance suite.

  A generator in another repository can now install the suite and run it against its own client, with
  a driver of its own. The package holds the specifications, the cases, the recording server, and the
  drivers for the TypeScript and Java client families in this repository.

### Patch Changes

- Updated dependencies [446f067]
- Updated dependencies [189ecc2]
- Updated dependencies [c438203]
  - @openapi-generator-plus/generator-common@1.9.0
