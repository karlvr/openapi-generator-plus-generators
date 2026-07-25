import { CodegenOperation, CodegenOperationGroup } from '@openapi-generator-plus/types'
import { capitalize, each, lowerCase, SKIP, ts } from '@openapi-generator-plus/template-utils'
import { e, htmlId, sorted } from '../helpers'

/**
 * Render the sidebar navigation: links to the overview, authentication (if
 * there are any security schemes), every endpoint grouped by operation
 * group, and the schemas index.
 */
export function sidebarSummary(groups: CodegenOperationGroup[], hasSecuritySchemes: boolean, navStyle: 'name' | 'full-path'): string {
	// summary.hbs opens with a comment followed by a blank line.
	return ts`

            <aside id="sidebar">
                <nav>
                    <ul>
                        <li><a href="#overview">Overview</a></li>
                    </ul>
${hasSecuritySchemes ? `                    <ul>
                        <li><a href="#auth">Authentication</a></li>
                    </ul>` : SKIP}
                    <ul id="endpoints-list">
                        <li class="title"><a href="#endpoints">Endpoints</a></li>
${each(sorted(groups, navStyle), (g) => sidebarGroup(g, navStyle), '\n')}
                    </ul>
                    <ul>
                        <li><a href="#schemas">Schemas</a></li>
                    </ul>
                </nav>
            </aside>`
}

function sidebarGroup(group: CodegenOperationGroup, navStyle: 'name' | 'full-path'): string {
	return ts`                            <li class="expandable">
                                <div class="endpoint"><a href="#group-${htmlId(group.name)}">${e(capitalize(group.name))}</a></div>
${group.operations.length > 0 ? sidebarOperations(group.operations, navStyle) : SKIP}
                            </li>`
}

function sidebarOperations(operations: CodegenOperation[], navStyle: 'name' | 'full-path'): string {
	return `                                    <section style="display: none">
                                        <ul>
${each(sorted(operations, navStyle), (op) => `                                                <li>
                                                    <div><a href="#operation-${htmlId(op.httpMethod)}-${htmlId(op.fullPath)}"><span class="method operation-${e(lowerCase(op.httpMethod))}">${e(op.httpMethod)}</span>&nbsp;${navStyle === 'full-path' ? e(op.fullPath) : e(op.name)}</a></div>
                                                </li>`, '\n')}
                                        </ul>
                                    </section>`
}
