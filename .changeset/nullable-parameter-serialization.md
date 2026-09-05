---
"@openapi-generator-plus/typescript-fetch-client-generator": patch
"@openapi-generator-plus/typescript-fetch-client-generator2": patch
"@openapi-generator-plus/typescript-fetch-node-client-generator": patch
"@openapi-generator-plus/typescript-fetch-node-client-generator2": patch
"@openapi-generator-plus/typescript-fetch-rn-client-generator": patch
---

Serialize a null form property or multipart part as an empty value.

A nullable request-body property or multipart part was tested only against `undefined` before the
client read it. A null array or object then reached `.map()` or a property access, and a null date
reached `dateToString()`. Both throw a TypeError. A null scalar became the text `null`.

A form encoding carries strings, so it has no null. The client now sends `prop=` for a null value,
which is what a null object property and a null array element already produced. An absent value
stays absent. So null and absent stay distinct.

Two shapes cannot carry an empty value, because they name each property rather than the property
itself. An exploded object and a `deepObject` are omitted when the object itself is null.

A multipart part is unchanged where it can encode null. A JSON part still sends `null`, and a text
part still sends an empty string. A binary part is omitted, because it has no null form.

A JSON request body is unaffected. It has always sent `null` for a null property.

A parameter and a header are no longer nullable. The core now ignores the nullability of their
schemas, and warns, because OpenAPI does not define how to send null in either.
