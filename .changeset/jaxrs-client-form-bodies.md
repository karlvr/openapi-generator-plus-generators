---
"@openapi-generator-plus/java-jaxrs-generator-common": minor
"@openapi-generator-plus/java-jaxrs-client-generator": major
"@openapi-generator-plus/java-cxf-client-generator": major
"@openapi-generator-plus/java-retrofit-client-generator": patch
---

Encode a form request body in the styles that the API declares.

An operation with an `application/x-www-form-urlencoded` body took a `javax.ws.rs.core.Form`, so the
caller named every field and encoded every value itself. JAX-RS applies none of the declared styles
to a `Form`, so no style reached the wire.

An operation now takes the model of its request body, as it already did for every other media type,
and the client builds the body. The joined, exploded and `deepObject` styles all reach the wire, and
a null property writes an empty value rather than being left out. An optional body that the caller
passes as null sends an empty form.

The Retrofit client encodes a form body the same way. The encoder lives in the shared package, so
both clients apply one set of style rules, and both emit a `FormEncoding` support class, which holds
the rules that turn a value into text.

A `spaceDelimited` or `pipeDelimited` value that explodes now writes one pair for each part, as
OpenAPI 3.1 defines. Both clients joined it.
