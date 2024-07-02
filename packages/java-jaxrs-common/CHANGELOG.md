# @openapi-generator-plus/java-jaxrs-generator-common

## 2.8.2

### Patch Changes

- Updated dependencies [4b9c50f]
  - @openapi-generator-plus/handlebars-templates@1.6.0

## 2.8.1

### Patch Changes

- Updated dependencies [df4a78f]
  - @openapi-generator-plus/handlebars-templates@1.5.1

## 2.8.0

### Minor Changes

- 18ff6da: Support new FILE schema type

### Patch Changes

- 506c9be: Use pnpm 9 and workspace uris
- a5c7d64: Update templates for changes to multipart file properties to no longer contain metadata generated in core. If we want to bring back metadata in a generator template we'll need to add a specific FILE type to store that.
- 2f86851: Update openapi-generator-plus upstream
- Updated dependencies [506c9be]
- Updated dependencies [18ff6da]
- Updated dependencies [5c51b1d]
- Updated dependencies [a5c7d64]
- Updated dependencies [6d43eca]
- Updated dependencies [5790781]
- Updated dependencies [2f86851]
  - @openapi-generator-plus/handlebars-templates@1.5.0
  - @openapi-generator-plus/java-like-generator-helper@2.2.1
  - @openapi-generator-plus/generator-common@1.4.1

## 2.7.0

### Minor Changes

- 26c8e2bd: Fix handling of catch-all responses

### Patch Changes

- Updated dependencies [26c8e2bd]
  - @openapi-generator-plus/handlebars-templates@1.4.0
  - @openapi-generator-plus/generator-common@1.4.0
  - @openapi-generator-plus/java-like-generator-helper@2.2.0

## 2.6.0

### Minor Changes

- a1322325: Fix discriminator property in @JsonTypeInfo to use serialized name

### Patch Changes

- bc8647d6: Update core
- Updated dependencies [bc8647d6]
  - @openapi-generator-plus/handlebars-templates@1.3.5
  - @openapi-generator-plus/generator-common@1.3.9
  - @openapi-generator-plus/java-like-generator-helper@2.1.10

## 2.5.4

### Patch Changes

- 9b87ba44: Update core
- Updated dependencies [9b87ba44]
  - @openapi-generator-plus/handlebars-templates@1.3.4
  - @openapi-generator-plus/generator-common@1.3.8
  - @openapi-generator-plus/java-like-generator-helper@2.1.9

## 2.5.3

### Patch Changes

- cc2bb308: Update core types
- Updated dependencies [cc2bb308]
  - @openapi-generator-plus/handlebars-templates@1.3.3
  - @openapi-generator-plus/generator-common@1.3.7
  - @openapi-generator-plus/java-like-generator-helper@2.1.8

## 2.5.2

### Patch Changes

- 81de680: Update to latest core types
- Updated dependencies [81de680]
  - @openapi-generator-plus/handlebars-templates@1.3.2
  - @openapi-generator-plus/generator-common@1.3.6
  - @openapi-generator-plus/java-like-generator-helper@2.1.7

## 2.5.1

### Patch Changes

- d41da8d: Upgrade core types
- b6d16d9: Update dependencies
- Updated dependencies [d41da8d]
- Updated dependencies [b6d16d9]
- Updated dependencies [1f8b503]
  - @openapi-generator-plus/handlebars-templates@1.3.1
  - @openapi-generator-plus/generator-common@1.3.5
  - @openapi-generator-plus/java-like-generator-helper@2.1.6

## 2.5.0

### Minor Changes

- 8c9c533: Update third party dependencies

### Patch Changes

- 1862f39: Added space around equals sign on Operation tag
- Updated dependencies [59c2ca9]
- Updated dependencies [8c9c533]
  - @openapi-generator-plus/generator-common@1.3.4
  - @openapi-generator-plus/handlebars-templates@1.3.0
  - @openapi-generator-plus/java-like-generator-helper@2.1.5

## 2.4.0

### Minor Changes

- 899a92d: Support optional security requirements in swagger v3 annotations

## 2.3.1

### Patch Changes

- 03bf3e3: Change the suffix for long constants from l to L

## 2.3.0

### Minor Changes

- cd474f9: Add equals, hashCode and toString to wrapper classes

### Patch Changes

- da518bb: Update core types
- Updated dependencies [da518bb]
  - @openapi-generator-plus/handlebars-templates@1.2.4
  - @openapi-generator-plus/generator-common@1.3.3
  - @openapi-generator-plus/java-like-generator-helper@2.1.4

## 2.2.1

### Patch Changes

- 4dff720: Fix for Jackson DEDUCTION detection in 8ec1f5209a7ff6787c7a3987b4403843298a9192

## 2.2.0

### Minor Changes

- d64090b: Standardise wrapper class value property methods so we have addValue helpers for wrapped array properties
- 8ec1f52: Don't use Jackson's DEDUCTION if the schema isn't compatible with it

### Patch Changes

- 93780ce: Fix generation failure when we don't have an ApiSpec implementation (as we don't without cxf)

## 2.1.4

### Patch Changes

- Updated dependencies [5601ab5]
  - @openapi-generator-plus/handlebars-templates@1.2.3
  - @openapi-generator-plus/java-like-generator-helper@2.1.3

## 2.1.3

### Patch Changes

- 9732cd1: Update core to 2.3.0
- Updated dependencies [9732cd1]
  - @openapi-generator-plus/generator-common@1.3.2
  - @openapi-generator-plus/handlebars-templates@1.2.2
  - @openapi-generator-plus/java-like-generator-helper@2.1.2

## 2.1.2

### Patch Changes

- d2d2faa: java-jaxrs: fix whitespace in front of @QueryParam

## 2.1.1

### Patch Changes

- 691f556: Update core to 2.2.0
- Updated dependencies [691f556]
  - @openapi-generator-plus/generator-common@1.3.1
  - @openapi-generator-plus/handlebars-templates@1.2.1
  - @openapi-generator-plus/java-like-generator-helper@2.1.1

## 2.1.0

### Minor Changes

- 02405ff: Reimplement initialValue after previously removing it, with non-nulls only for required collections which maintains the convenience that we had previously.
- db48add: Upgrade core types to 2.1.0 to return the `initialValue` function removed incorrectly in 2.0.0
- 02405ff: Reimplement generating empty collections as initial values for required collections. It was a mistake to undo this behaviour. There is more detail on this decision in the implementation of the `initialValue` function.

  _Note_ The major changes in 2.0.0 have been partially undone; required collections default to empty collections again.

### Patch Changes

- Updated dependencies [db48add]
  - @openapi-generator-plus/generator-common@1.3.0
  - @openapi-generator-plus/handlebars-templates@1.2.0
  - @openapi-generator-plus/java-like-generator-helper@2.1.0

## 2.0.0

### Major Changes

- 19a8994: Update @openapi-generator-plus/core to 2.0.0

  _Note_ Please check the changelog for Java generators for breaking changes to the default values in generated model classes. But see the changelog for 2.1.0 above.

### Minor Changes

- 0664881: Don't generate default values for properties for clients

  The client should not send a value, and the server is expected to use its default value.
  Note this from the [OpenAPI specification](https://swagger.io/specification/#schema-object):

  > `default` - The default value represents what would be assumed by the consumer of the input as the value of the schema if one is not provided.

  _NOTE_: For Java clients some properties may be `null` where they previously had values when the object was constructed. Please check any differences in your generated code
  and check that your code won't cause a `NullPointerException` at runtime.

- 87bd6b5: Core has removed `initialValue` from the generator and renamed the `CodegenProperty` member to `defaultValue`

  The behaviour of the new `defaultValue` is significantly different to the old `initialValue`. Previously any
  _required_ property would have a non-null initial value; in Java generators this resulted in a default value
  non-null value for many properties in generated module objects.

  _NOTE_: For generated Java models some properties may be `null` where they previously had values when the object was constructed. Please check any
  differences in your generated code and check that your code won't cause a `NullPointerException` at runtime, such as if calling
  `model.getArrayProperty().add(value)`, assuming that `arrayProperty` will be non-null. Instead change to `model.arrayProperty().add(value)` or
  `model.addArrayProperty(value)`.

### Patch Changes

- Updated dependencies [19a8994]
- Updated dependencies [0664881]
  - @openapi-generator-plus/java-like-generator-helper@2.0.0
  - @openapi-generator-plus/generator-common@1.2.0
  - @openapi-generator-plus/handlebars-templates@1.1.4

## 1.3.1

### Patch Changes

- Updated dependencies [072fe50]
  - @openapi-generator-plus/handlebars-templates@1.1.3

## 1.3.0

### Minor Changes

- 7167f85: Add support for jakarta namespace using useJakarta config option

## 1.2.2

### Patch Changes

- 4ea4845: Tidy dependencies on @openapi-generator-plus core modules
- Updated dependencies [4ea4845]
- Updated dependencies [cab735b]
  - @openapi-generator-plus/generator-common@1.1.2
  - @openapi-generator-plus/handlebars-templates@1.1.2
  - @openapi-generator-plus/java-like-generator-helper@1.0.1

## 1.2.1

### Patch Changes

- 94f164c: Fix missing annotations on nested model interfaces

## 1.2.0

### Minor Changes

- 6ebd170: Check property compatibility for inheritance: null values aren't compatible as we use java.util.Optional

### Patch Changes

- Updated dependencies [be034fb]
- Updated dependencies [cb18c75]
  - @openapi-generator-plus/generator-common@1.1.0
  - @openapi-generator-plus/handlebars-templates@1.1.0

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
