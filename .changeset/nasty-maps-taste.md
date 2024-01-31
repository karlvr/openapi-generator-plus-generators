---
"@openapi-generator-plus/plain-documentation-generator": minor
---

Fix display of anonymous schemas inside models, especially enums

This was broken as anonymous schemas were often omitted from the documentation, but linked where they were referenced in a model.
