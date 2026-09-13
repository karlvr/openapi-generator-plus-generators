---
"@openapi-generator-plus/typescript-fetch-client-generator": minor
"@openapi-generator-plus/typescript-fetch-client-generator2": minor
"@openapi-generator-plus/typescript-fetch-node-client-generator": minor
"@openapi-generator-plus/typescript-fetch-node-client-generator2": minor
"@openapi-generator-plus/typescript-fetch-rn-client-generator": minor
---

Keep a discriminator property in the schema that declares it

A schema that declared a discriminator property lost it, when a member of the discriminator took the
property from that schema. The generated model then had no such property, so a caller could not read
it from a response, and could not send it in a request, even where the API requires it.

The core now keeps the property. The model declares it, and a member narrows the property to its own
value. A member that takes the property from another schema omits it from the extends clause, so that
it can narrow it.

A member of discriminators that disagree on its value narrows the property to the union of their
values, and declares it once. It declared the property once for each discriminator, so the model did
not compile.

Closes #48
