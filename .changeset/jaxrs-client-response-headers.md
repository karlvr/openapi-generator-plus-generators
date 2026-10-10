---
"@openapi-generator-plus/java-jaxrs-client-generator": major
"@openapi-generator-plus/java-cxf-client-generator": major
---

Give a caller the headers that a response declares.

An operation whose default response declares headers now returns an `<Operation><Code>` class
carrying the body and each header, rather than the body alone. Each generated exception now carries
the headers of its response beside `getEntity()`.

A required header that is absent, or a header that does not parse as its declared type, makes the
call throw `UnprocessableResponseException`, as a body that does not parse already does. A list
header may carry whitespace around its commas. A required header has a primitive type, so it is
never null.

This changes the return type of an affected operation, and the constructor of an affected exception.
