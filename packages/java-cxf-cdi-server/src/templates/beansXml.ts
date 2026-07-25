import { ts } from '@openapi-generator-plus/template-utils'

/** The CDI `beans.xml` descriptor enabling annotation-based bean discovery. */
export function beansXml(): string {
	return ts`
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://xmlns.jcp.org/xml/ns/javaee"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee
         http://xmlns.jcp.org/xml/ns/javaee/beans_1_1.xsd"
	version="1.1" bean-discovery-mode="annotated">
</beans>
`
}
