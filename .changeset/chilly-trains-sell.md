---
"@openapi-generator-plus/java-jaxrs-generator-common": minor
---

Add JsonTypeInfo.Id.DEDUCTION when there is no discriminator

At the moment we add this whenever there is a hierarchy, but we should _probably_
know when there is intentional polymorphism and only output the Jackson polymorphism
headers then. Perhaps our `oneOf` etc when converted to objects should retain some
evidence of their provinence so we can use it, or perhaps a `polymorphic` property.
