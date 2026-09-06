---
"@openapi-generator-plus/java-jaxrs-client-generator": patch
"@openapi-generator-plus/java-cxf-client-generator": patch
---

Give each multipart part its own name.

The client built each `multipart/form-data` part with a content disposition that named the
part, but it gave the attachment no id. CXF takes the name from the id when it writes the
part, so every part arrived as `Content-Disposition: form-data; name="null"`.

A server could not tell the parts apart. It saw several parts with the same name, and none
with the name that the specification declares.

The client now sets the id as well as the disposition.
