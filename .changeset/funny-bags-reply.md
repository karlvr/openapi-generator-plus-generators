---
"@openapi-generator-plus/java-jaxrs-generator-common": minor
---

Move property annotations to fields as `@BeanParam` doesn't support property getters

At least in CXF, the implementation that populates `@BeanParam` only considers fields and methods that start with the word `set` (see `BeanResourceInfo.setParamMethods`).
This only impacts JAX-RS param annotations, but I've decided to move all of the annotations to the fields. This also makes our annotations consistent between the Lombok
and non-Lombok versions of the generated code.
