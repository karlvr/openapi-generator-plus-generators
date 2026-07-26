import { CodegenContent, CodegenOperation, CodegenOperationGroup } from '@openapi-generator-plus/types'
import { ts, each, className, identifier, nonDefaultResponses } from '@openapi-generator-plus/template-utils'
import { imports } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { ServerContext } from './types'
import { operationServiceVars } from './frag/operationServiceVars'

/** The placeholder method body: a value that satisfies the return type well enough to compile, or an `UnsupportedOperationException`. */
function methodBody(operation: CodegenOperation): string {
	if (!operation.returnNativeType) {
		return ''
	}
	const content: CodegenContent | undefined = operation.defaultResponse?.defaultContent ?? undefined
	if (!content) {
		return '\t\tthrow new UnsupportedOperationException();\n'
	}
	if (content.examples?.java) {
		return `\t\treturn ${content.examples.java.valueLiteral};\n`
	} else if (content.examples?.default) {
		return `\t\treturn ${content.examples.default.valueLiteral};\n`
	} else if (content.schema?.nullable) {
		return '\t\treturn null;\n'
	} else {
		return '\t\tthrow new UnsupportedOperationException();\n'
	}
}

/** One operation's generated (placeholder) service method implementation. */
function serviceImplMethod(operation: CodegenOperation, ctx: ServerContext): string {
	const { parameters } = operationServiceVars(operation, ctx)
	const responses = nonDefaultResponses(operation)
	const throwsClause = responses.map((response, i) => `${i === 0 ? ' throws' : ','} ${className(ctx.generatorContext.generator(), `${operation.name}_${response.code}`)}Exception`).join('')
	const returnType = operation.returnNativeType ? operation.returnNativeType : 'void'

	return ts`
	@java.lang.Override
	public ${returnType} ${identifier(ctx.generatorContext.generator(), operation.name)}(${parameters})${throwsClause} {
		// TODO
${methodBody(operation)}	}

`
}

/** The generated (placeholder) implementation of one operation group's API service, ready for the user to fill in. */
export function apiServiceImpl(group: CodegenOperationGroup, ctx: ServerContext): string {
	const name = className(ctx.generatorContext.generator(), group.name)
	const apiServiceImplPackage = ctx.root.apiServiceImplPackage
	if (!apiServiceImplPackage) {
		throw new Error('apiServiceImpl requires apiServiceImplPackage to be set')
	}

	/* `each` methods, joined with no separator (each already ends in its own blank
	   line). Trimmed to exactly one trailing newline before the closing brace that
	   follows on the next template line, which supplies the separator itself. */
	const operations = each(group.operations, operation => serviceImplMethod(operation, ctx), '')
	const operationsText = typeof operations === 'string' ? operations.replace(/\n+$/, '\n') : operations

	return ts`
package ${apiServiceImplPackage};

${imports(ctx.root)}
${ctx.templates.apiServiceImplClassAnnotations(group, ctx)}
public class ${name}ApiServiceImpl implements ${ctx.root.apiServicePackage}.${name}ApiService {

${operationsText}
}
`
}
