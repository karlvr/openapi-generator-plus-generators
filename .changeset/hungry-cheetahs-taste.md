---
"@openapi-generator-plus/handlebars-templates": minor
"@openapi-generator-plus/java-jaxrs-generator-common": minor
---

Don't generate POJO required properties constructor

This was a mistake. I am worried about the order of parameters in the constructor changing if the API spec changes, which
could result in existing code that calls these constructors passing the wrong values to the wrong parameters
as Java doesn't have named parameters. There's no guarantee about the order of properties in an object or that the
required properties will stay consistent.
