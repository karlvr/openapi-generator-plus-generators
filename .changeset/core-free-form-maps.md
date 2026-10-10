---
"@openapi-generator-plus/generator-common": patch
"@openapi-generator-plus/client-conformance": patch
---

Require a core that models `additionalProperties: true` and `{}` as a map of any values

Core 2.33.0 is the first release that gives a generator the `any` schema type for the values of such
a map. An earlier core gives it strings, so a generated client cannot hold a value such as a nested
object.

The dependency on the core now asks for 2.33.0, and the dependency on the testing package, which
pins the core, asks for 2.33.0 too.
