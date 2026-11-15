---
"@openapi-generator-plus/typescript-fetch-client-generator2": patch
---

Compile the client with `verbatimModuleSyntax`, `erasableSyntaxOnly` and without the DOM library

Enum values now live in a `const` that merges with the model namespace, so `Api.Status` is still both a type and a value. `defaultFetch` looks up the global `fetch` at each call.
