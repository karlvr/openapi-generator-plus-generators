---
"@openapi-generator-plus/java-jaxrs-generator-common": minor
---

Remove `java.io.Serializable` from models [#28]

We use `java.util.Optional` which isn't serializable.
