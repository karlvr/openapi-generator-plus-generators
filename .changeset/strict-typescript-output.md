---
"@openapi-generator-plus/typescript-generator-common": minor
"@openapi-generator-plus/typescript-fetch-client-generator": minor
"@openapi-generator-plus/typescript-fetch-client-generator2": minor
"@openapi-generator-plus/typescript-fetch-node-client-generator": minor
"@openapi-generator-plus/typescript-fetch-node-client-generator2": minor
"@openapi-generator-plus/typescript-fetch-rn-client-generator": minor
"@openapi-generator-plus/typescript-express-example-server-generator": minor
---

Generate a `tsconfig.json` that sets `strict`.

The generated `tsconfig.json` set only `noImplicitAny`. So the test suite compiled the generated
code with `strictNullChecks` off, and it could not find null-safety defects. A consumer who sets
`strict` found them instead. See https://github.com/karlvr/openapi-generator-plus-generators/issues/59
