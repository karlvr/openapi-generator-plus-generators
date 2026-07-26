import { CodegenHeader } from '@openapi-generator-plus/types'
import { ts, className, identifier, join, each, when, SKIP, Skip } from '@openapi-generator-plus/template-utils'
import { getter, setter } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { ServerContext } from '../types'
import { MyDefaultResponseWrapper } from '../../internal-types'

/** One header's getter/setter pair (unless using Lombok) and its chaining accessor. */
function headerAccessor(header: CodegenHeader, wrapperName: string, ctx: ServerContext): string {
	const generator = ctx.generatorContext.generator()
	const name = identifier(generator, header.name)
	const getterSetter = !ctx.root.useLombok
		? ts`
	public ${header.nativeType} ${getter(header, generator, ctx.root.useLombok)}() {
		return this.${name};
	}

	public void ${setter(header, generator, ctx.root.useLombok)}(${header.nativeType} ${name}) {
		this.${name} = ${name};
	}

`
		: ''

	return ts`
${getterSetter}	public ${wrapperName} ${name}(${header.nativeType} ${name}) {
		${setter(header, generator, ctx.root.useLombok)}(${name});
		return this;
	}

`
}

/** The body's getter/setter pair (unless using Lombok) and its chaining accessor, when the wrapper has a body. */
function bodyAccessor(wrapper: MyDefaultResponseWrapper, wrapperName: string, ctx: ServerContext): string | Skip {
	if (!wrapper.bodyNativeType) {
		return SKIP
	}
	const getterSetter = !ctx.root.useLombok
		? ts`
	public ${wrapper.bodyNativeType} getBody() {
		return this.body;
	}

	public void setBody(${wrapper.bodyNativeType} body) {
		this.body = body;
	}

`
		: ''

	return ts`
${getterSetter}	public ${wrapperName} body(${wrapper.bodyNativeType} body) {
		setBody(body);
		return this;
	}

`
}

/**
 * The response wrapper class generated for an operation whose default response has
 * headers (see {@link MyDefaultResponseWrapper}): a field per header and (if present) the
 * body, a constructor taking the body and any required headers, and chaining
 * setters/getters for each.
 */
export function responseWrapper(wrapper: MyDefaultResponseWrapper, ctx: ServerContext): string {
	const generator = ctx.generatorContext.generator()
	const name = className(generator, wrapper.name)
	const headers = wrapper.headers ?? []

	const constructorParams = join([
		wrapper.bodyNativeType ? `${wrapper.bodyNativeType} body` : SKIP,
		...headers.map(h => h.required ? `${h.nativeType} ${identifier(generator, h.name)}` : SKIP),
	], ', ')

	const constructorAssignments = join([
		wrapper.bodyNativeType ? '\t\tthis.body = body;' : SKIP,
		...headers.filter(h => h.required).map(h => `\t\tthis.${identifier(generator, h.name)} = ${identifier(generator, h.name)};`),
	], '\n')

	/*
	 * The body accessor and each header accessor individually end in their own trailing
	 * blank line (matching the blank line separating one method from the next); combined
	 * here via plain concatenation — not `ts` interpolation, which would double the last
	 * one's blank line against the template's own line break before the closing brace.
	 */
	const bodyAcc = bodyAccessor(wrapper, name, ctx)
	const bodyAccText = typeof bodyAcc === 'string' ? bodyAcc : ''
	const headerAccText = headers.map(h => headerAccessor(h, name, ctx)).join('')
	const accessorsCombined = bodyAccText + headerAccText
	const accessorsText: string | Skip = accessorsCombined ? accessorsCombined.replace(/\n+$/, '\n') : SKIP

	return ts`
${when(ctx.root.useLombok, () => ts`
@lombok.Getter
@lombok.Setter`)}
public static class ${name} {

${when(wrapper.bodyNativeType, () => `\tprivate ${wrapper.bodyNativeType} body;`)}
${each(headers, h => `\tprivate ${h.nativeType} ${identifier(generator, h.name)};`, '\n')}

	public ${name}(${constructorParams}) {
${constructorAssignments}
	}

${accessorsText}
}

`
}
