---
"@openapi-generator-plus/typescript-fetch-client-generator2": minor
"@openapi-generator-plus/typescript-fetch-node-client-generator2": minor
---

Return an undocumented response when a `default` response does not document the content type.

An operation with a `default` response returned `undefined` when the server sent a content type
that no response documents. The declared return type did not admit `undefined`.

A `default` response covers every status code, but only the content types that it documents. So
`UndocumentedResponse` rejoins the response union for these operations, and the client returns it.
Handle the extra `'undocumented'` case in a caller that switches on the response status.
