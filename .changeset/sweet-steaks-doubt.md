---
"@openapi-generator-plus/java-jaxrs-generator-common": minor
---

Reimplement generating empty collections as initial values for required collections. It was a mistake to undo this behaviour. There is more detail on this decision in the implementation of the `initialValue` function.
