---
"@openapi-generator-plus/typescript-generator-common": minor
"@openapi-generator-plus/typescript-fetch-client-generator2": minor
"@openapi-generator-plus/typescript-fetch-node-client-generator2": minor
---

Delete the API files of removed operation groups when you generate with the `--clean` flag.

The generator emits one file per operation group in the `api` directory. Before this change the clean step did not remove the file of a group that the API specification no longer contains.

The clean step also removes the `api` directory, if the API has no operation groups.
