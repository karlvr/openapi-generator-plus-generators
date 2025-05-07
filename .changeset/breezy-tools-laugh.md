---
"@openapi-generator-plus/typescript-fetch-client-generator2": major
---

Divide the API into different files for each group and removed the classes in favour of exposing the endpoint functions directly. The equivalent of creating a new class instance of the API is using the `withConfiguration(...)` function from each API file. Alternatively, the configuration can be set globally using `setDefaultConfiguration`. By default, it uses `defaultFetch` and the `BASE_URI` from the API specification (if there's only one server).
