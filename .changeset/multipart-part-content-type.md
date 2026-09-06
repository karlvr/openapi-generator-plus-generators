---
"@openapi-generator-plus/typescript-fetch-client-generator": minor
"@openapi-generator-plus/typescript-fetch-client-generator2": minor
"@openapi-generator-plus/typescript-fetch-node-client-generator": minor
"@openapi-generator-plus/typescript-fetch-node-client-generator2": minor
"@openapi-generator-plus/typescript-fetch-rn-client-generator": minor
---

Declare the content type that a specification gives a multipart part.

An `encoding` with a `contentType` of `application/json` produced a part that declared no
content type at all. The client appended the JSON as text, so the part arrived as
`text/plain`. A server that reads a part by its declared type could not parse it.

The client now attaches the content type to the part.

A browser `FormData` can only give a part a content type through a `Blob`, and a form
names every `Blob` `blob`. So a typed part now carries `filename="blob"` as well. A server
that sorts its parts by the presence of a filename sees this part as a file. The Node
clients use the `form-data` package, which takes the content type as an option, so their
parts carry no filename.

The new `multipartTypedPart` hook renders such a part, so a child generator can attach the
content type in the way that its own multipart implementation needs.
