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
		// assertNotNull(result);`
		: SKIP

	return ts`
	@Test
	public void ${name}Test() {
		// Response response = this.api.${name}(${args});
		// assertNotNull(response);
${returnAssertion}
	}

`
}

/** This generator's empty-bodied API test class for `group`, wired up to run over CXF's local transport under Spring. */
export function apiTest(group: CodegenOperationGroup, ctx: JavaModelContext): string {
	const generator = ctx.generatorContext.generator()
	const name = className(generator, group.name)
	const root = ctx.root as ServerRootContext
	const jx = javax(root.useJakarta)
	const junitVersion = root.junitVersion

	const operationsText = each(group.operations, operation => operationTest(operation, ctx), '')

	const staticAssertImport = junitVersion === 4
		? 'import static org.junit.Assert.*;'
		: 'import static org.junit.jupiter.api.Assertions.*;'

	const junitImports = junitVersion === 4
		? ts`
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;`
		: ts`
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;`

	const springTestImport = junitVersion === 4
		? 'import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;'
		: 'import org.springframework.test.context.junit.jupiter.SpringExtension;'

	const runnerAnnotation = junitVersion === 4
		? '@RunWith(SpringJUnit4ClassRunner.class)'
		: '@ExtendWith(SpringExtension.class)'

	const setupAnnotation = junitVersion === 4 ? '@Before' : '@BeforeEach'
	const destroyAnnotation = junitVersion === 4 ? '@After' : '@AfterEach'

	return ts`
package ${root.apiPackage};

${staticAssertImport}

import ${jx}.ws.rs.core.Response;

import org.apache.cxf.endpoint.Server;
import org.apache.cxf.jaxrs.client.JAXRSClientFactory;
import org.apache.cxf.jaxrs.client.WebClient;
import org.apache.cxf.jaxrs.spring.JAXRSServerFactoryBeanDefinitionParser.SpringJAXRSServerFactoryBean;
import org.apache.cxf.transport.local.LocalConduit;
${junitImports}
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
${springTestImport}

${runnerAnnotation}
@ContextConfiguration(classes = { TestConfiguration.class })
public class ${name}ApiTest {

	private Server server;
	private ${root.apiPackage}.${name}Api api;

	@Autowired
	private SpringJAXRSServerFactoryBean serverFactory;

	${setupAnnotation}
	public void setup() throws Exception {
		server = serverFactory.create();
		api = JAXRSClientFactory.create(TestConfiguration.ENDPOINT_ADDRESS, ${root.apiPackage}.${name}Api.class, TestConfiguration.defaultProviders());
		WebClient.getConfig(api).getRequestContext().put(LocalConduit.DIRECT_DISPATCH, Boolean.TRUE);
	}

	${destroyAnnotation}
	public void destroy() throws Exception {
		server.stop();
		server.destroy();
	}

${operationsText}}
`
}
