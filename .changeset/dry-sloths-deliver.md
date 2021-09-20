---
"@openapi-generator-plus/typescript-generator-common": minor
---

Improve generated code for oneOf, allOf + discriminator etc

Previously we converted all usages of a oneOf / allOf type to a disjunction. Now we only do
that when the type isn't one that was named in the original spec. Now we leave the original
type usage, as the original type is itself a disjunction and it's more expressive to use the
original name.

We also generate a new disjunction type for allOf + discriminator and use that when referring
to the type, rather than using the disjunction everywhere. This makes the type easier to
consume.
