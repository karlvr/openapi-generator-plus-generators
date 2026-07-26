import { CodegenOperation } from '@openapi-generator-plus/types'
import { lowerCase, maybe, md, SKIP, ts, upperCase } from '@openapi-generator-plus/template-utils'
import { e, htmlId } from '../helpers'
import { PlainDocumentationHooks, RootContext } from '../types'
import { parametersSection } from './parameters'
import { requestBodySection } from './requestBody'
import { responsesSection } from './responses'
import { securityRequirementsSection } from './security'

/** Render the documentation box for a single operation. */
export function operationSection(op: CodegenOperation, rootContext: RootContext, hooks: PlainDocumentationHooks): string {
	// operation.hbs opens with a comment followed by a blank line.
	return ts`

<section class="summary operation${op.deprecated ? ' -deprecated' : ''}" data-path="${e(op.fullPath)}" data-method="${e(op.httpMethod)}" id="operation-${htmlId(op.httpMethod)}-${htmlId(op.fullPath)}">
    <h4 class="api-title"><span class="method operation-${e(lowerCase(op.httpMethod))}">${e(upperCase(op.httpMethod))}</span> ${e(op.fullPath)}</h4>

${maybe(hooks.operationHeader?.(op, rootContext))}

${op.deprecated ? '    <p><strong class="operation-label -deprecated">DEPRECATED</strong></p>' : SKIP}

    ${md(op.summary)}
    ${md(op.description)}

\t<div class="operationId">
        <h5>Operation ID</h5>

        <table>
            <tr>
                <td class="type">
                    ${e(op.name)}
                </td>
            </tr>
        </table>
    </div>

${securityRequirementsSection(op.securityRequirements)}
${requestBodySection(op)}
${parametersSection(op)}
${responsesSection(op)}

${maybe(hooks.operationFooter?.(op, rootContext))}
</section>`
}
