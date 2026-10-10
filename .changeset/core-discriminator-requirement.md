---
"@openapi-generator-plus/generator-common": patch
---

Require a core that keeps a discriminator property in the schema that declares it

The generators render a discriminator property from the schema that the specification declares it in.
Core 2.32.0 is the first release that keeps the property there. An earlier core removes it, and the
Java templates then produce a client that sends no discriminator value at all, because the field that
Jackson writes the value from does not exist.

The dependency on the core now asks for 2.32.0.
