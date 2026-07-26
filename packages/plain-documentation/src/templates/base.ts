import { CodegenInfo } from '@openapi-generator-plus/types'
import { md, ts } from '@openapi-generator-plus/template-utils'
import { e } from './helpers'
import { DocumentContext, PlainDocumentationHooks } from './types'
import { sidebarSummary } from './api/summary'
import { securitySchemesSection } from './api/security'
import { endpointsSection } from './api/group'
import { schemasSection } from './api/schemas'

/** Render the page's `<header>`, containing the document's title. */
export function pageHeader(info: CodegenInfo): string {
	return `<header id="header">
\t<h1>${e(info.title)}</h1>
</header>`
}

/** Render the page's `<footer>`. */
export function pageFooter(): string {
	return `<footer id="footer">

</footer>`
}

/**
 * Render the page's `<body>` content: the sidebar summary, the overview
 * section, authentication, endpoints and schemas.
 */
export function pageBody(doc: DocumentContext, hooks: PlainDocumentationHooks): string {
	const navStyle = doc.operations?.navStyle ?? 'name'
	// body.hbs opens with a comment followed by a blank line.
	return ts`

<div class="main">

${sidebarSummary(doc.groups, !!(doc.securitySchemes && doc.securitySchemes.length > 0), navStyle)}

\t<article id="overview" class="content">
\t\t<section class="summary">
\t\t\t<h2>Overview</h2>
\t\t\t${md(doc.info.description)}
\t\t</section>
\t</article>

${securitySchemesSection(doc.securitySchemes)}

${endpointsSection(doc.groups, doc, hooks)}

${schemasSection(doc.schemas, navStyle)}

</div>`
}
