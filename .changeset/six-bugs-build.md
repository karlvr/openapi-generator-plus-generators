---
"@openapi-generator-plus/java-jaxrs-generator-common": patch
---

Restore the `@JsonValue` annotation on wrapper class value fields

Wrapper classes were missing `@JsonValue`, so they serialized as an object with a `value`
property instead of the raw wrapped value. The annotation was lost when property annotations
were moved onto fields; the wrapper template still passed the `@JsonValue` override to the
fluent-methods partial, which no longer renders property annotations, so it was emitted nowhere.
