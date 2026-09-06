---
"@openapi-generator-plus/java-jaxrs-client-generator": patch
"@openapi-generator-plus/java-cxf-client-generator": patch
---

Declare the annotation packages that the generated code uses.

Every generated file carries a `@javax.annotation.Generated` annotation, and a model carries
`@javax.xml.bind.annotation.XmlRootElement`. Java 11 removed both packages from the JDK, and
the generated `pom.xml` declared neither. So the project did not compile on a current JDK,
unless another dependency happened to bring them in.

The `pom.xml` now declares `javax.annotation-api` and `jaxb-api`, as it already did for the
Jakarta equivalents. Set the `javax_annotation` and `javax_xml_bind` Maven version options to
choose the versions.

The java-jaxrs-client suite now compiles a generated project, rather than only rendering it.
