import { CodegenOAuthFlow, CodegenSecurityRequirements, CodegenSecurityScheme } from '@openapi-generator-plus/types'
import { each, indent, maybe, md, Skip, SKIP, sentenceCase, ts, when } from '@openapi-generator-plus/template-utils'
import { e, htmlId } from '../helpers'

/** Render the "Security" table listing the schemes that satisfy an operation's security requirements. */
export function securityRequirementsSection(req: CodegenSecurityRequirements | null): string | Skip {
	if (!req) {
		return SKIP
	}
	return ts`\t<div class="security">
        <h5>Security</h5>

        <table>
${each(req.requirements, (r) => each(r.schemes, (s) => ts`                <tr>
                    <td><a href="#/security/${htmlId(s.scheme.name)}">${e(s.scheme.type)}</a></td>
                    <td class="type">
${each(s.scopes ?? [], (sc, i, first, last) => `                            ${e(sc.name)}${!last ? ',' : ''}`, '\n')}
                    </td>
                </tr>`, '\n'), '\n')}
        </table>
    </div>`
}

/** Render the "Authentication" article listing every security scheme in the document. */
export function securitySchemesSection(schemes: CodegenSecurityScheme[] | null): string | Skip {
	if (!schemes || schemes.length === 0) {
		return SKIP
	}
	return `\t<article id="auth" class="content">
\t\t<section class="summary">
\t\t\t<h2>Authentication</h2>
${each(schemes, (s) => indent(securityScheme(s), '\t\t\t\t'), '\n')}
\t\t</section>
\t</article>`
}

function securityScheme(scheme: CodegenSecurityScheme): string {
	return ts`<a name="/security/${htmlId(scheme.name)}"></a>
<h3>${e(scheme.type)}</h3>

${md(scheme.description)}

<section class="summary">
${securitySchemeBodyAndClose(scheme)}`
}

/**
 * Render the security scheme's type-specific body together with the closing
 * `</section>`. Handlebars' whitespace control (verified empirically against
 * the original template) closes the section at column 0 for the isApiKey and
 * isOAuth branches, but leaves it indented one tab for isOpenIdConnect — an
 * artifact of that branch being the last `{{else if}}` in the chain.
 */
function securitySchemeBodyAndClose(scheme: CodegenSecurityScheme): string {
	if (scheme.isApiKey) {
		return `${apiKeyTable(scheme)}\n</section>`
	}
	if (scheme.isOAuth) {
		return `${each(scheme.flows ?? [], (flow) => oauthFlow(flow), '\n')}\n</section>`
	}
	if (scheme.isOpenIdConnect) {
		return `${openIdConnectTable(scheme)}\n\t</section>`
	}
	return '</section>'
}

function apiKeyTable(scheme: CodegenSecurityScheme): string {
	const label = scheme.in === 'header' ? 'Header'
		: scheme.in === 'query' ? 'Query Parameter'
		: scheme.in === 'cookie' ? 'Cookie Name'
		: `${e(scheme.in ?? '')} Name`
	return `\t\t<table>
\t\t\t<tbody>
\t\t\t\t\t<tr>
\t\t\t\t\t\t<td class="name">${label}</td>
\t\t\t\t\t\t<td class="type">${e(scheme.paramName ?? '')}</td>
\t\t\t\t\t</tr>
\t\t\t</tbody>
\t\t</table>`
}

function openIdConnectTable(scheme: CodegenSecurityScheme): string {
	return `\t\t<table>
\t\t\t<tbody>
\t\t\t\t<tr>
\t\t\t\t\t<td class="name">OpenId Connect URL</td>
\t\t\t\t\t<td class="type">${e(scheme.openIdConnectUrl ?? '')}</td>
\t\t\t\t</tr>
\t\t\t</tbody>
\t\t</table>`
}

function oauthFlow(flow: CodegenOAuthFlow): string {
	const { scopes } = flow
	return ts`\t\t\t<h4>${e(sentenceCase(flow.type))} flow</h4>
\t\t\t<table class="auth-flows">
\t\t\t\t<tbody>
${maybe(flow.authorizationUrl, u => `\t\t\t\t\t<tr>
\t\t\t\t\t\t<td class="name">Authorization URL</td>
\t\t\t\t\t\t<td class="type">${e(u)}</td>
\t\t\t\t\t</tr>`)}
${maybe(flow.tokenUrl, u => `\t\t\t\t\t<tr>
\t\t\t\t\t\t<td class="name">Token URL</td>
\t\t\t\t\t\t<td class="type">${e(u)}</td>
\t\t\t\t\t</tr>`)}
${maybe(flow.refreshUrl, u => `\t\t\t\t\t<tr>
\t\t\t\t\t\t<td class="name">Refresh URL</td>
\t\t\t\t\t\t<td class="type">${e(u)}</td>
\t\t\t\t\t</tr>`)}
\t\t\t\t</tbody>
\t\t\t</table>

${(scopes && scopes.length > 0) ? `\t\t\t<h5>Scopes</h5>
\t\t\t<table class="auth-scopes">
\t\t\t\t<tbody>
${each(scopes!, (sc) => `\t\t\t\t\t<tr>
\t\t\t\t\t\t<td class="type">${e(sc.name)}</td>
\t\t\t\t\t\t<td>
\t\t\t\t\t\t\t${e(sc.description ?? '')}
\t\t\t\t\t\t</td>
\t\t\t\t\t</tr>`, '\n')}
\t\t\t\t</tbody>
\t\t\t</table>` : SKIP}`
}
