---
"@openapi-generator-plus/typescript-fetch-client-generator2": patch
---

Compile a response header whose schema is a `date-time` or a `boolean`

The client read each header twice, and TypeScript does not narrow the second read, so the value
had the type `string | null`. `new Date(...)` did not accept it, and a boolean header had the type
`boolean | ""`. The conversion now receives a `string`.
