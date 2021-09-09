---
"@openapi-generator-plus/plain-documentation-generator": minor
---

Fix the handling of anonymous schemas, such as those created for inline request bodies and responses. Before the recent core upgrade they appeared in the definitions along with all of the other schemas. After the recent core upgrade they didn't appear at all. Now they appear inline with the operation that uses them.
