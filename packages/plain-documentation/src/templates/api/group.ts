import { CodegenOperationGroup } from '@openapi-generator-plus/types'
import { each, sentenceCase, ts } from '@openapi-generator-plus/template-utils'
import { e, htmlId, sorted } from '../helpers'
import { PlainDocumentationHooks, RootContext } from '../types'
import { operationSection } from './operation'

/** Render the "Endpoints" article listing every operation group in the document. */
export function endpointsSection(groups: CodegenOperationGroup[], rootContext: RootContext, hooks: PlainDocumentationHooks): string {
	const navStyle = rootContext.operations?.navStyle ?? 'name'
	return ts`<article id="endpoints" class="content">
    <h2>Endpoints</h2>
${each(sorted(groups, navStyle), (g) => operationGroup(g, rootContext, hooks), '\n')}
</article>`
}

function operationGroup(group: CodegenOperationGroup, rootContext: RootContext, hooks: PlainDocumentationHooks): string {
	const navStyle = rootContext.operations?.navStyle ?? 'name'
	// group.hbs opens with a comment followed by a blank line.
	return ts`

<span id="group-${htmlId(group.name)}" data-path="${e(group.path)}" class="operation-group"></span>
<h3 class="group">${e(sentenceCase(group.name))}</h3>
${each(sorted(group.operations, navStyle), (op) => operationSection(op, rootContext, hooks), '\n')}`
}
