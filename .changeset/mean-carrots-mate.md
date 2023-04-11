---
"@openapi-generator-plus/typescript-express-example-server-generator": patch
"@openapi-generator-plus/typescript-generator-common": patch
---

Fix enum literals in TypeScript generators that don't use the chainTypeScriptGeneratorContext method (regression from 57ed79a5f49c95007af80745c86a9c4efd650070)
