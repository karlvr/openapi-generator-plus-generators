import { CodegenOperation, CodegenOperationGroup } from '@openapi-generator-plus/types'
import { ts, each, className, identifier } from '@openapi-generator-plus/template-utils'
import { JavaModelContext, operationVars } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { bodyParam } from '@openapi-generator-plus/java-jaxrs-client-generator'

/** One operation's placeholder test method, its call commented out until the caller fills in real values. */
function operationTest(operation: CodegenOperation, ctx: JavaModelContext): string {
	const { arguments: args } = operationVars(operation, { jaxrs: false, service: false }, bodyParam, ctx)
	const name = identifier(ctx.generatorContext.generator(), operation.name)

	return ts`
	@Test
	public void ${name}Test() throws java.lang.Exception {
		// api.${name}(${args});
	}

`
}

/** This client's empty-bodied API test class for `group`, instantiating the generated API implementation directly. */
export function apiTest(group: CodegenOperationGroup, ctx: JavaModelContext): string {
	const generator = ctx.generatorContext.generator()
	const name = className(generator, group.name)
	const root = ctx.root

	const operationsText = each(group.operations, operation => operationTest(operation, ctx), '')

	return ts`
package ${root.apiPackage};

import org.junit.jupiter.api.Test;

public class ${name}ApiTest {

	${ctx.templates.inject({ interface: `${root.apiPackage}.${name}Api`, class: `${root.apiImplPackage}.${name}ApiImpl`, name: 'api' }, ctx)}

${operationsText}}
`
}
