---
"@openapi-generator-plus/template-utils": minor
"@openapi-generator-plus/typescript-fetch-client-generator": patch
"@openapi-generator-plus/typescript-fetch-client-generator2": patch
"@openapi-generator-plus/typescript-fetch-node-client-generator": patch
"@openapi-generator-plus/typescript-fetch-node-client-generator2": patch
"@openapi-generator-plus/typescript-fetch-rn-client-generator": patch
---

Fix `Content-Type` header for `multipart/form-data` request bodies.

We must allow `fetch` to automatically set the `Content-Type` header for `multipart/form-data` request bodies as it includes the `boundary` parameter from the `FormData`.
