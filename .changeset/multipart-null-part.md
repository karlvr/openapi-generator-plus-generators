---
"@openapi-generator-plus/java-jaxrs-client-generator": patch
"@openapi-generator-plus/java-cxf-client-generator": patch
---

Send a null multipart part in the form that its part type can carry.

A nullable multipart part gave the attachment a null object when its value was null. CXF
needs an object to choose a writer, so the whole request failed with a processing
exception. A caller could not send null for such a part at all.

Each part type now has its own null form, which matches what the TypeScript clients send. A
JSON part sends the JSON literal `null`. A text part sends an empty string. A binary part
has no null form, so the client omits it, and null and absent stay distinct for the parts
that can tell them apart.
