---
"@openapi-generator-plus/generator-common": patch
---

Declare the `rimraf` dependency of `testGenerate`.

`dist/testing` imports `rimraf`, but the package did not declare it. A project outside this repository
that called `testGenerate` failed with "Cannot find module 'rimraf'", unless it happened to install
`rimraf` itself.
