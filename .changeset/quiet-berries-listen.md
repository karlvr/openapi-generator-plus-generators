---
"@openapi-generator-plus/typescript-fetch-client-generator": minor
---

Change response handling to examine schema type to decide whether to use binary or text handling if the mime type isn't JSON

The client can now handle arbitrary binary responses such as images and PDFs, and arbitrary string responses.
