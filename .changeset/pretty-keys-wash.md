---
"@openapi-generator-plus/plain-documentation-generator": minor
---

Fix and greatly improve the generation of documentation for allOf, anyOf, oneOf

We generate native allOf, anyOf and oneOf from core so we can now output documentation that is much
closer to the original specification, rather than representing a conversion to an object hierarchy
that is more specific to a language.
