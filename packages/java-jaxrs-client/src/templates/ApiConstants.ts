import { CodegenServer } from '@openapi-generator-plus/types'
import { ts, each, indent, maybe, constantName, stringLiteral, md, indentTail, SKIP, Skip } from '@openapi-generator-plus/template-utils'
import { generatedAnnotation } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { ClientContext } from './types'

/** One configured server's constant declaration, preceded by its documentation comment if it has one. */
function serverConstant(server: CodegenServer, index: number, ctx: ClientContext): string {
	const generator = ctx.generatorContext.generator()
	const nameSource = server.vendorExtensions?.['x-name'] !== undefined ? `${String(server.vendorExtensions['x-name'])}Server` : `Server_${String(index)}`

	return ts`
${maybe(server.description, d => ts`
/**
 * ${indentTail(md(d), ' * ')}
 */`)}
java.lang.String ${constantName(generator, nameSource)} = ${stringLiteral(ctx.generatorContext, server.url)};

`
}

/**
 * The generated `ApiConstants` interface: the default server URL, one constant per configured
 * server, and the `apiConstantsBody` extension point (e.g. a CXF-based client's connection and
 * receive timeout defaults).
 */
export function apiConstants(servers: CodegenServer[] | null, ctx: ClientContext): string {
	const server = servers && servers.length > 0 ? servers[0] : null

	const serverDoc: string | Skip = server?.description ? ts`
/**
 * ${indentTail(md(server.description), ' * ')}
 */` : SKIP

	const serverConstants = each(servers, (s, i) => serverConstant(s, i, ctx), '')
	const serverConstantsText = typeof serverConstants === 'string' ? indent(serverConstants, '\t') : ''

	/*
	 * `apiConstantsBody` is appended mid-line (not alone on its own template line): the
	 * server-constants block above already ends in its own trailing blank line, and
	 * embedding a SKIP-able value alone-on-line straight after a value that itself ends in
	 * a blank line would double that blank line up.
	 */
	const apiConstantsBody = ctx.templates.apiConstantsBody(ctx)
	const apiConstantsBodyText = typeof apiConstantsBody === 'string' ? `\t${apiConstantsBody}\n` : ''

	return ts`
package ${ctx.root.apiPackage};

${generatedAnnotation(ctx.root)}
public interface ApiConstants {

	${serverDoc}
	java.lang.String DEFAULT_SERVER = ${stringLiteral(ctx.generatorContext, server ? server.url : null)};

${serverConstantsText}${apiConstantsBodyText}}
`
}
