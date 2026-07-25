import { CodegenHeader, CodegenOperation, CodegenOperationGroup, CodegenResponse } from '@openapi-generator-plus/types'
import { ts, each, join, when, maybe, md, indent, indentTail, className, identifier, SKIP, Skip, nonDefaultResponses } from '@openapi-generator-plus/template-utils'
import { imports, operationDocumentation, generatedAnnotation, getter } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { ServerContext } from './types'
import { responseWrapper } from './frag/responseWrapper'
import { operationServiceVars } from './frag/operationServiceVars'
import { MyResponse } from '../internal-types'

/** The abstract service method's name for a non-default response of `operation`: `{Operation}_{code}Exception`. */
function exceptionClassName(operation: CodegenOperation, response: CodegenResponse, ctx: ServerContext): string {
	return `${className(ctx.generatorContext.generator(), `${operation.name}_${response.code}`)}Exception`
}

/** One operation's abstract service method declaration, throwing one exception type per non-default response. */
function serviceMethodDeclaration(operation: CodegenOperation, ctx: ServerContext): string {
	const { parameters } = operationServiceVars(operation, ctx)
	const responses = nonDefaultResponses(operation)
	const throwsClause = responses.map((response, i) => `${i === 0 ? ' throws' : ','} ${exceptionClassName(operation, response, ctx)}`).join('')

	return ts`
	${operationDocumentation(operation)}
	${operation.returnNativeType ? operation.returnNativeType : 'void'} ${identifier(ctx.generatorContext.generator(), operation.name)}(${parameters})${throwsClause};
`
}

/**
 * One field's getter (unless using Lombok) and chaining `field(value)` accessor, for a
 * field of an exception class — the exception class's fields (`responseCode`, `entity`,
 * and its response's headers) all share this same shape.
 */
function exceptionField(fieldType: string, name: string, exceptionName: string, getterName: string, ctx: ServerContext): string {
	const getterBlock = !ctx.root.useLombok
		? ts`
public ${fieldType} ${getterName}() {
	return this.${name};
}

`
		: ''

	return ts`
${getterBlock}public ${exceptionName} ${name}(${fieldType} ${name}) {
	this.${name} = ${name};
	return this;
}

`
}

/** The exception class generated for one non-default response of `operation`. */
function exceptionClass(operation: CodegenOperation, response: CodegenResponse, ctx: ServerContext): string {
	const generator = ctx.generatorContext.generator()
	const useLombok = ctx.root.useLombok
	const name = exceptionClassName(operation, response, ctx)
	const headers: CodegenHeader[] = response.headers ? Array.from(ctx.generatorContext.utils.values(response.headers)) : []
	const entityType = response.defaultContent?.nativeType

	const statusLine = response.isCatchAll
		? ' * <p>Sends the response status provided in the constructor.</p>'
		: ` * <p>Sends a response with a ${String(response.code)} status.</p>`

	const constructorParams = join([
		when(response.isCatchAll, 'int responseCode'),
		entityType ? `${entityType} entity` : SKIP,
		...headers.map(h => h.required ? `${h.nativeType} ${identifier(generator, h.name)}` : SKIP),
	], ', ')

	const constructorAssignments = join([
		when(response.isCatchAll, '\t\t\tthis.responseCode = responseCode;'),
		entityType ? '\t\t\tthis.entity = entity;' : SKIP,
		...headers.filter(h => h.required).map(h => `\t\t\tthis.${identifier(generator, h.name)} = ${identifier(generator, h.name)};`),
	], '\n')

	/*
	 * Each accessor block (responseCode/entity/header) ends in its own trailing blank
	 * line — required so that concatenating multiple header accessors reproduces the
	 * blank line between them. Assembled below via plain concatenation (not `ts`
	 * interpolation) so those trailing blank lines aren't doubled.
	 */
	const responseCodeAccessors = response.isCatchAll ? exceptionField('int', 'responseCode', name, 'getResponseCode', ctx) : ''
	const entityAccessors = entityType ? exceptionField(`${entityType}`, 'entity', name, 'getEntity', ctx) : ''
	const headerAccessors = headers.map(h => exceptionField(`${h.nativeType}`, identifier(generator, h.name), name, getter(h, generator, useLombok), ctx)).join('')
	const hookText = ctx.templates.apiServiceException(operation, ctx)
	const hookLine = typeof hookText === 'string' ? `\t\t${hookText}\n` : ''

	const combinedAccessorsAndHook = indent(responseCodeAccessors + entityAccessors + headerAccessors, '\t\t') + hookLine
	/* Trimmed to exactly one trailing newline: this is embedded alone-on-line, immediately
	   followed by more template content, which supplies the blank-line separator itself. */
	const accessorsAndHook: string | Skip = combinedAccessorsAndHook ? combinedAccessorsAndHook.replace(/\n+$/, '\n') : SKIP

	return ts`
	/**
	${maybe(response.description, d => ` * ${indentTail(md(d), ' * ')}`)}
	${statusLine}
	 */
	${when(useLombok, () => ts`
@lombok.Getter
@lombok.Setter`)}
	class ${name} extends Exception {

		private static final long serialVersionUID = 1L;

		${when(response.isCatchAll, 'private int responseCode;')}
		${entityType ? `private ${entityType} entity;` : SKIP}
		${each(headers, h => `private ${h.nativeType} ${identifier(generator, h.name)};`, '\n')}

		public ${name}(${constructorParams}) {
${constructorAssignments}
		}

${accessorsAndHook}
	}

`
}

/** The response wrapper (if the operation's default response has headers) and one exception class per non-default response. */
function wrapperAndExceptions(operation: CodegenOperation, ctx: ServerContext): string {
	const wrapper = (operation.defaultResponse as MyResponse | null)?.__wrapper
	const wrapperBlock = wrapper ? ts`\t${responseWrapper(wrapper, ctx)}` : ''
	const exceptions = nonDefaultResponses(operation).map(response => exceptionClass(operation, response, ctx)).join('')

	return wrapperBlock + exceptions
}

/** The API service interface for one operation group: one abstract method per operation, plus their exception classes. */
export function apiService(group: CodegenOperationGroup, ctx: ServerContext): string {
	const name = className(ctx.generatorContext.generator(), group.name)

	const methodDeclarations = each(group.operations, operation => serviceMethodDeclaration(operation, ctx), '')
	const methodDeclarationsText = typeof methodDeclarations === 'string' ? methodDeclarations : ''
	const wrapperAndExceptionsText = group.operations.map(operation => wrapperAndExceptions(operation, ctx)).join('')

	const header = ts`
package ${ctx.root.apiServicePackage};

${imports(ctx.root)}
${generatedAnnotation(ctx.root)}
public interface ${name}ApiService {

`
	/*
	 * `methodDeclarationsText` ends in exactly one newline (no blank line); the blank
	 * line separating it from the exception classes below is added explicitly here
	 * (unconditional, matching the original), then `wrapperAndExceptionsText` (which
	 * itself ends in its own trailing blank line when non-empty) is appended directly —
	 * built via plain concatenation, not `ts` interpolation, to avoid doubling either
	 * blank line.
	 */
	return `${header}${methodDeclarationsText}\n${wrapperAndExceptionsText}}\n`
}
