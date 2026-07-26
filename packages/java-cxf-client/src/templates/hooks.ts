import { JavaJaxrsTemplates } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { apiConstantsBody } from './apiConstants'
import { apiInvokerInterfaceBody } from './apiInvoker'
import { apiImplHeader, apiImplClassBody } from './apiImpl'
import { injectApi } from './injectApi'
import { pomBuild, pomDependencies, pomDependencyManagement, pomProperties } from './pom'
import { apiTest } from './apiTest'

/**
 * This generator's overrides of `java-jaxrs-client`'s extension points: the CXF-specific
 * `ApiConstants`/`ApiInvoker`/API-implementation content (including one `authorize*` method
 * pair per configured security scheme — see `securityScheme.ts`), the API-client field
 * declaration (bypassing the generic `inject` hook, since this client manages its own CXF
 * client), the CXF-specific `pom.xml` dependencies, and the generated test scaffold.
 */
export const hooks: Partial<JavaJaxrsTemplates> = {
	apiConstantsBody,
	apiInvokerInterfaceBody,
	apiImplHeader,
	apiImplClassBody,
	injectApi,
	pomBuild,
	pomDependencies,
	pomDependencyManagement,
	pomProperties,
	apiTest,
}
