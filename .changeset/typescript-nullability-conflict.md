---
"@openapi-generator-plus/typescript-generator-common": patch
---

Treat a nullability difference as a property conflict.

An `allOf` child that made an inherited property nullable still extended its parent. TypeScript
rejects the result, because `string | null` is not assignable to `string`.

The generator now reports the difference through `checkPropertyCompatibility`, as the Java
generators already do. The child drops the `extends`, which is what a type conflict or a required
conflict already produced. A child that removes nullability narrows the parent property, so it
keeps the `extends`.
