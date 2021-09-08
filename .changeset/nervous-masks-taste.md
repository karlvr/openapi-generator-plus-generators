---
"@openapi-generator-plus/typescript-fetch-client-generator": patch
---

Fix x-www-form-urlencoded body handling

I left in the old code after the previous upgrade to respect encodings.
