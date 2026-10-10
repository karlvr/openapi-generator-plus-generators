---
"@openapi-generator-plus/typescript-fetch-client-generator2": patch
---

Read an array response header as its elements.

A response that declared an array header generated code that did not compile, because the client
gave the raw header text where the type was an array. The client now splits the header on its
commas, and on any whitespace around them, and converts each element to its declared type.
