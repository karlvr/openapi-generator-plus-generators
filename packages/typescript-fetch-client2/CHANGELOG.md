# @openapi-generator-plus/typescript-fetch-client-generator2

## 0.4.0

### Minor Changes

- 06429d6: Rename automatically generated parameters interface from `EndpointRequest` to `EndpointParameters`

  This is to better represent its purpose; to encapsulate endpoint _parameters_ and so as not to be
  confused with the interfaces we might automatically name for a request body that currently end with
  `Request`.

  This does mean a migration for any existing code with endpoints that have more than one parameters.
  I have treated this as a minor, rather than major, version bump due to the prerelease nature
  of this generator template.

## 0.3.2

### Patch Changes

- 5601ab5: Support illegal identifiers in model interfaces
- Updated dependencies [5601ab5]
  - @openapi-generator-plus/handlebars-templates@1.2.3
  - @openapi-generator-plus/typescript-generator-common@1.5.2

## 0.3.1

### Patch Changes

- 9732cd1: Update core to 2.3.0
- bd75c7d: Fix whitespace in interface extends
- Updated dependencies [9732cd1]
  - @openapi-generator-plus/generator-common@1.3.2
  - @openapi-generator-plus/handlebars-templates@1.2.2
  - @openapi-generator-plus/typescript-generator-common@1.5.1

## 0.3.0

### Minor Changes

- 7477d77: Change approach for discriminator inheritance incompatibility to use Omit rather than resorting to avoiding inheritance

### Patch Changes

- Updated dependencies [7477d77]
  - @openapi-generator-plus/typescript-generator-common@1.5.0

## 0.2.1

### Patch Changes

- 691f556: Update core to 2.2.0
- Updated dependencies [691f556]
- Updated dependencies [84e4151]
  - @openapi-generator-plus/generator-common@1.3.1
  - @openapi-generator-plus/handlebars-templates@1.2.1
  - @openapi-generator-plus/typescript-generator-common@1.4.0

## 0.2.0

### Minor Changes

- db48add: Upgrade core types to 2.1.0 to return the `initialValue` function removed incorrectly in 2.0.0

### Patch Changes

- Updated dependencies [02405ff]
- Updated dependencies [db48add]
  - @openapi-generator-plus/typescript-generator-common@1.3.0
  - @openapi-generator-plus/generator-common@1.3.0
  - @openapi-generator-plus/handlebars-templates@1.2.0

## 0.1.1

### Patch Changes

- 19a8994: Update @openapi-generator-plus/core to 2.0.0

  _Note_ Please check the changelog for Java generators for breaking changes to the default values in generated model classes.

- Updated dependencies [19a8994]
- Updated dependencies [0664881]
- Updated dependencies [87bd6b5]
  - @openapi-generator-plus/generator-common@1.2.0
  - @openapi-generator-plus/handlebars-templates@1.1.4
  - @openapi-generator-plus/typescript-generator-common@1.2.0

## 0.1.0

### Minor Changes

- 2842518: Add blind-date configuration for date-time implementation type

### Patch Changes

- Updated dependencies [2842518]
- Updated dependencies [072fe50]
  - @openapi-generator-plus/typescript-generator-common@1.1.0
  - @openapi-generator-plus/handlebars-templates@1.1.3

## 0.0.3

### Patch Changes

- 4ea4845: Tidy dependencies on @openapi-generator-plus core modules
- Updated dependencies [4ea4845]
- Updated dependencies [cab735b]
  - @openapi-generator-plus/generator-common@1.1.2
  - @openapi-generator-plus/handlebars-templates@1.1.2
  - @openapi-generator-plus/typescript-generator-common@1.0.2

## 0.0.2

### Patch Changes

- 53b8a63: Fix interface properties' use of `frag/propertyDocumentation`
- Updated dependencies [be034fb]
- Updated dependencies [cb18c75]
  - @openapi-generator-plus/generator-common@1.1.0
  - @openapi-generator-plus/handlebars-templates@1.1.0
