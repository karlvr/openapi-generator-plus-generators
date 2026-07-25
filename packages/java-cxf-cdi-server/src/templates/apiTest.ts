import { CodegenOperation, CodegenOperationGroup } from '@openapi-generator-plus/types'
import { ts, each, className, identifier, SKIP, Skip } from '@openapi-generator-plus/template-utils'
import { JavaModelContext, operationVars, javax } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { bodyParam, ServerRootContext } from '@openapi-generator-plus/java-jaxrs-server-generator'

/** One operation's placeholder test method, its request commented out until the caller fills in real values. */
function operationTest(operation: CodegenOperation, ctx: JavaModelContext): string {
	const { arguments: args } = operationVars(operation, { jaxrs: false, service: false }, bodyParam, ctx)
	const name = identifier(ctx.generatorContext.generator(), operation.name)
	const returnNativeType = operation.returnNativeType
	const returnAssertion: string | Skip = returnNativeType
		? ts`
		// ${returnNativeType} result = response.readEntity(${returnNativeType.literalType}.class);
		// Assertions.assertNotNull(result);`
		: SKIP

	return ts`
	@Test
	public void ${name}Test() {
		// Response response = this.api.${name}(${args});
		// Assertions.assertNotNull(response);
${returnAssertion}
	}

`
}

/** This generator's empty-bodied API test class for `group`, wired up to run over CXF's local transport under Weld. */
export function apiTest(group: CodegenOperationGroup, ctx: JavaModelContext): string {
	const generator = ctx.generatorContext.generator()
	const name = className(generator, group.name)
	const root = ctx.root as ServerRootContext
	const jx = javax(root.useJakarta)

	const operationsText = each(group.operations, operation => operationTest(operation, ctx), '')

	return ts`
package ${root.apiPackage};

import java.util.ArrayList;

import ${jx}.ws.rs.core.Response;

import org.apache.cxf.jaxrs.client.JAXRSClientFactory;
import org.apache.cxf.jaxrs.client.WebClient;
import org.apache.cxf.transport.local.LocalConduit;
import org.jboss.weld.junit5.EnableWeld;
import org.jboss.weld.junit5.WeldInitiator;
import org.jboss.weld.junit5.WeldSetup;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;

@TestInstance(Lifecycle.PER_CLASS)
@EnableWeld
public class ${name}ApiTest {

	@WeldSetup
	private WeldInitiator weld = WeldInitiator.from(WeldInitiator.createWeld()
			.addPackages(${root.apiImplPackage}.${name}ApiImpl.class, ${root.apiServiceImplPackage ?? ''}.${name}ApiServiceImpl.class)
			.addBeanClasses(${root.invokerPackage ?? ''}.${root.invokerName ?? ''}.class)
			.addBeanClasses(TestConfiguration.class)
			.addExtension(new org.apache.cxf.cdi.JAXRSCdiResourceExtension()))
	.build();

	private ${root.apiPackage}.${name}Api api;

	@BeforeAll
	public void setup() throws Exception {
		api = JAXRSClientFactory.create(TestConfiguration.ENDPOINT_ADDRESS, ${root.apiPackage}.${name}Api.class, TestConfiguration.defaultProviders());
		WebClient.getConfig(api).getRequestContext().put(LocalConduit.DIRECT_DISPATCH, Boolean.TRUE);
	}

${operationsText}}
`
}
