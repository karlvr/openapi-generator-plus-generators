---
"@openapi-generator-plus/java-jaxrs-generator-common": minor
---

For API params objects only generate a required parameters constructor for path parameters

This is because those are the only (required) parameters that are (reasonably) guaranteed to remain in the
same order (unless the path structure is changed, which I hope is unlikely). I'm concerned that with constructors,
as Java doesn't have named parameters, that a change in the order that parameters are declared would result in
the generated constructors changing the order of parameters and if the types match, then the compiler wouldn't
notice and values would go into the wrong properties.
