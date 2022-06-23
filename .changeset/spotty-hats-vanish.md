---
"@openapi-generator-plus/java-jaxrs-generator-common": minor
"@openapi-generator-plus/plain-documentation-generator": minor
"@openapi-generator-plus/typescript-generator-common": minor
---

Core has removed `initialValue` from the generator and renamed the `CodegenProperty` member to `defaultValue`

The behaviour of the new `defaultValue` is significantly different to the old `initialValue`. Previously any
_required_ property would have a non-null initial value; in Java generators this resulted in a default value
non-null value for many properties in generated module objects.

*NOTE*: For generated Java models some properties may be `null` where they previously had values when the object was constructed. Please check any
differences in your generated code and check that your code won't cause a `NullPointerException` at runtime, such as if calling
`model.getArrayProperty().add(value)`, assuming that `arrayProperty` will be non-null. Instead change to `model.arrayProperty().add(value)` or
`model.addArrayProperty(value)`.
