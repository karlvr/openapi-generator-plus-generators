import { CodegenArraySchema, CodegenContent, CodegenHeader, CodegenLogLevel, CodegenOperation, CodegenOperationGroup, CodegenResponse, CodegenSchema, CodegenSchemaType } from '@openapi-generator-plus/types'
import * as idx from '@openapi-generator-plus/indexed-type'
import { ts, className, identifier, indent, stringLiteral } from '@openapi-generator-plus/template-utils'
import { getter } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { ClientContext } from '../types'
import { RESPONSE_HEADERS_CLASS } from '../ResponseHeaders'

/** The name of the local that holds the JAX-RS `Response` of a call, in the generated implementation. */
export const RESPONSE_VAR = '__response'

/**
 * One value that a generated response class carries: the body of the response, or one header
 * that the API declares on it.
 *
 * A response class is immutable, so each member becomes a final field, a constructor
 * parameter and a getter. {@link ResponseMember.statements} and
 * {@link ResponseMember.argument} together read the value from a JAX-RS `Response`.
 */
export interface ResponseMember {
	/** The Java type of the value. */
	type: string
	/** The name of the field and of the constructor parameter. */
	name: string
	/** The name of the getter. */
	getterName: string
	/** The text of the getter's documentation comment, without its delimiters. */
	documentation: string
	/** Statements that must run before {@link ResponseMember.argument}, each on its own line. */
	statements: string[]
	/** An expression that gives the value, valid after {@link ResponseMember.statements} have run. */
	argument: string
}

/**
 * A Java expression that reads `value`, a non-null `String` expression, as the scalar type of
 * `schema`, or null when the client cannot read that type from a header.
 *
 * A header is text, so the client parses each one with the rule that reads a literal of that
 * type. An object cannot come from one header value, so the client cannot read it.
 */
function parsedHeaderValue(schema: CodegenSchema, value: string): string | null {
	const nativeType = `${schema.nativeType}`
	switch (schema.schemaType) {
		case CodegenSchemaType.STRING:
			if (schema.format === 'uuid') {
				return `java.util.UUID.fromString(${value})`
			} else if (schema.format === 'url') {
				return null
			}
			return value
		case CodegenSchemaType.INTEGER:
		case CodegenSchemaType.NUMBER:
			if (nativeType === 'java.math.BigDecimal' || nativeType === 'java.math.BigInteger') {
				return `new ${nativeType}(${value})`
			}
			return `${boxedType(nativeType)}.valueOf(${value})`
		case CodegenSchemaType.BOOLEAN:
			return `java.lang.Boolean.valueOf(${value})`
		case CodegenSchemaType.DATE:
		case CodegenSchemaType.TIME:
		case CodegenSchemaType.DATETIME:
			return `${nativeType}.parse(${value})`
		case CodegenSchemaType.ENUM:
			return `${nativeType}.fromValue(${value})`
		default:
			return null
	}
}

/** The class of `nativeType`, which boxes it when it is a primitive. */
function boxedType(nativeType: string): string {
	switch (nativeType) {
		case 'int': return 'java.lang.Integer'
		case 'long': return 'java.lang.Long'
		case 'short': return 'java.lang.Short'
		case 'byte': return 'java.lang.Byte'
		case 'float': return 'java.lang.Float'
		case 'double': return 'java.lang.Double'
		case 'boolean': return 'java.lang.Boolean'
		default: return nativeType
	}
}

/** The name of the parameter of the lambda that parses one header value. */
const HEADER_VALUE = '__value'

/**
 * A Java expression that reads `header` from {@link RESPONSE_VAR} as the type that the API gives
 * it, or null when the client cannot read that type from a header.
 *
 * The expression reports an absent required header, or a value that does not parse, as an
 * `UnprocessableResponseException`.
 */
function headerReader(header: CodegenHeader, ctx: ClientContext): string | null {
	const support = `${ctx.root.apiImplPackage}.${RESPONSE_HEADERS_CLASS}`
	const name = stringLiteral(ctx.generatorContext, header.serializedName)
	const required = header.required ? 'true' : 'false'

	if (header.schema.schemaType === CodegenSchemaType.ARRAY) {
		/* A header array separates its elements with commas, in every style that a header allows */
		const component = (header.schema as CodegenArraySchema).component
		const element = parsedHeaderValue(component.schema, HEADER_VALUE)
		if (element === null) {
			return null
		}
		const collection = `${header.nativeType.concreteType}::new`
		return `${support}.readCollection(${RESPONSE_VAR}, ${name}, ${required}, ${collection}, ${HEADER_VALUE} -> ${element})`
	}

	const parsed = parsedHeaderValue(header.schema, HEADER_VALUE)
	if (parsed === null) {
		return null
	}
	return `${support}.read(${RESPONSE_VAR}, ${name}, ${required}, ${HEADER_VALUE} -> ${parsed})`
}

/**
 * The name that a generated class takes for `response`: the operation's name followed by the
 * status code, such as `GetUser200`. A catch-all response uses `Default`, because `default` is
 * the code that the API gives it.
 *
 * The exception classes build on this name too, so a response is named the same way wherever
 * it appears.
 */
export function responseClassName(operation: CodegenOperation, response: CodegenResponse, ctx: ClientContext): string {
	return className(ctx.generatorContext.generator(), `${operation.name}_${String(response.code)}`)
}

/** The headers that `response` declares, in the order of the API. */
export function responseHeaders(response: CodegenResponse): CodegenHeader[] {
	return response.headers ? idx.allValues(response.headers) : []
}

/**
 * One header's member.
 *
 * A required header is never null, because the client reports an absent one as a failure of
 * the response.
 */
function headerMember(header: CodegenHeader, operation: CodegenOperation, ctx: ClientContext): ResponseMember {
	const name = identifier(ctx.generatorContext.generator(), header.name)
	const local = `__${name}`
	const reader = headerReader(header, ctx)

	if (reader === null) {
		ctx.generatorContext.log(CodegenLogLevel.WARN, `Cannot read the "${header.serializedName}" response header of operation "${operation.name}" as ${header.nativeType}, so the client leaves it null`)
	}

	return {
		type: `${header.nativeType}`,
		name,
		getterName: getter(header, ctx.generatorContext.generator(), ctx.root.useLombok),
		documentation: header.required
			? `The {@code ${header.serializedName}} header.`
			: `The {@code ${header.serializedName}} header, or null when the response did not carry it.`,
		statements: reader !== null ? [`${header.nativeType} ${local} = ${reader};`] : [],
		argument: reader === null
			? `null /* The client cannot read a ${header.nativeType} from a header */`
			: local,
	}
}

/**
 * The body's member, or null when the response declares no content.
 *
 * `name` and `getterName` differ between a response class and an exception class, which
 * names the same value an entity.
 */
function bodyMember(content: CodegenContent | null, name: string, getterName: string): ResponseMember | null {
	if (!content || !content.nativeType) {
		return null
	}
	return {
		type: `${content.nativeType}`,
		name,
		getterName,
		documentation: 'The body of the response.',
		statements: [],
		argument: `${RESPONSE_VAR}.readEntity(${content.nativeType.literalType}.class)`,
	}
}

/** The members of the class that carries `response` with `content`, using `bodyName` for its body. */
export function responseMembers(response: CodegenResponse, content: CodegenContent | null, bodyName: string, bodyGetterName: string, operation: CodegenOperation, ctx: ClientContext): ResponseMember[] {
	const body = bodyMember(content, bodyName, bodyGetterName)
	return [
		...(body ? [body] : []),
		...responseHeaders(response).map(header => headerMember(header, operation, ctx)),
	]
}

/**
 * The body of a response class at column 0: a final field for each member, a constructor that
 * takes them all, and a getter for each. Renders nothing when there are no members.
 *
 * The caller indents this to the column of its class body.
 */
export function responseClassBody(name: string, members: ResponseMember[]): string {
	if (members.length === 0) {
		return `public ${name}() {\n\n}\n`
	}

	const fields = members.map(member => `private final ${member.type} ${member.name};`).join('\n')
	const parameters = members.map(member => `${member.type} ${member.name}`).join(', ')
	const assignments = members.map(member => `this.${member.name} = ${member.name};`).join('\n')
	const getters = members.map(member => `/** ${member.documentation} */
public ${member.type} ${member.getterName}() {
	return this.${member.name};
}
`).join('\n')

	return `${fields}

public ${name}(${parameters}) {
${indent(assignments, '\t')}
}

${getters}`
}

/**
 * How the generated implementation builds an instance of a response class: the statements
 * that its members need, then an expression that constructs it.
 *
 * Emit {@link ResponseClassBuilding.statements} on their own lines before using
 * {@link ResponseClassBuilding.expression}, which a `return` or a `throw` then takes.
 */
export interface ResponseClassBuilding {
	/** Statements that must run first. Each ends with a ";". Empty when the class needs none. */
	statements: string
	/** An expression that constructs the class. It does not end a statement. */
	expression: string
}

/**
 * How to build an instance of the response class `type` from {@link RESPONSE_VAR}.
 *
 * Use this where a JAX-RS `Response` is in scope under the name that {@link RESPONSE_VAR}
 * gives.
 */
export function responseClassBuilding(type: string, members: ResponseMember[]): ResponseClassBuilding {
	const statements = members.flatMap(member => member.statements)
	return {
		statements: statements.length > 0 ? `${statements.join('\n')}\n` : '',
		expression: members.length > 0
			? `new ${type}(\n${members.map(member => `\t${member.argument}`).join(',\n')}\n)`
			: `new ${type}()`,
	}
}

/**
 * The class that carries the default response of an operation, when that response declares
 * headers. An operation returns the body alone unless it has one of these.
 */
export interface ResponseWrapper {
	/** The simple name of the class. The class nests in the `Api` interface of its group. */
	name: string
	/** The fully qualified name of the class. */
	nativeType: string
	/** The members that the class carries: its body, when the response has content, and each header. */
	members: ResponseMember[]
}

/** The response wrapper of `operation`, or null when the operation returns its body alone. */
export function responseWrapper(operation: CodegenOperation, group: CodegenOperationGroup, ctx: ClientContext): ResponseWrapper | null {
	const response = operation.defaultResponse
	if (!response || responseHeaders(response).length === 0) {
		return null
	}

	const generator = ctx.generatorContext.generator()
	const name = responseClassName(operation, response, ctx)
	return {
		name,
		nativeType: `${ctx.root.apiPackage}.${className(generator, group.name)}Api.${name}`,
		members: responseMembers(response, response.defaultContent, 'body', 'getBody', operation, ctx),
	}
}

/** The return type of `operation` on the `Api` interface: its wrapper, its body, or `void`. */
export function operationReturnType(operation: CodegenOperation, group: CodegenOperationGroup, ctx: ClientContext): string {
	const wrapper = responseWrapper(operation, group, ctx)
	if (wrapper) {
		return wrapper.nativeType
	}
	return operation.returnNativeType ? `${operation.returnNativeType}` : 'void'
}

/** One wrapper class, nested in the `Api` interface at one tab of indentation. */
export function responseWrapperClass(wrapper: ResponseWrapper, operation: CodegenOperation, ctx: ClientContext): string {
	return ts`
	/**
	 * The response of {@link #${identifier(ctx.generatorContext.generator(), operation.name)}}: its body and the headers that the API declares.
	 */
	class ${wrapper.name} {

${indent(responseClassBody(wrapper.name, wrapper.members), '\t\t')}
	}

`
}
