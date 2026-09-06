---
"@openapi-generator-plus/java-cxf-client-generator": patch
---

Let the generated project run its own tests.

With `includeTests`, the generated `pom.xml` gave the Surefire plugin a JUnit engine
dependency of its own. Surefire supplies its own JUnit platform launcher, and aligns it
with the JUnit that the project declares. The plugin dependency pinned the platform on one
side only, so the two disagreed and Surefire refused to start. `mvn test` then failed with
a `NoSuchMethodError` before it ran a test.

The plugin now names no JUnit artifact, and Surefire aligns the whole platform itself.

The `junit_jupiter` Maven version option also had no effect, because the template held the
version as a literal. It now reads the option, as the other generators do.
