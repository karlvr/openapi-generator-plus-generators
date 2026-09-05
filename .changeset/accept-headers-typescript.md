---
"@openapi-generator-plus/typescript-generator-common": minor
"@openapi-generator-plus/typescript-fetch-client-generator": minor
"@openapi-generator-plus/typescript-fetch-client-generator2": minor
"@openapi-generator-plus/typescript-fetch-node-client-generator": minor
"@openapi-generator-plus/typescript-fetch-node-client-generator2": minor
"@openapi-generator-plus/typescript-fetch-rn-client-generator": minor
---

Send an `Accept` header for each operation. The header lists the media types of the operation's default response. It lists only the media types that the client can parse.

A caller can override the header.

The header describes the whole request, not one status code. So it never lists a media type that only an error response declares.
