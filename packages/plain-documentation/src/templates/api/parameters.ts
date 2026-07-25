import { CodegenExamples, CodegenMediaType, CodegenOperation, CodegenParameter, isCodegenArraySchema } from '@openapi-generator-plus/types'
import { each, indent, maybe, md, SKIP, ts, when } from '@openapi-generator-plus/template-utils'
import * as idx from '@openapi-generator-plus/indexed-type'
import { e, stringify } from '../helpers'
import { datatype } from '../model/datatype'

/** Render the "Parameters" table for an operation, if it has any parameters. */
export function parametersSection(op: CodegenOperation): string {
	// parameters.hbs opens with a comment followed by a blank line that is
	// present unconditionally, regardless of whether there are parameters.
	return ts`

${when(op.parameters, () => parametersBlock(op))}`
}

function parametersBlock(op: CodegenOperation): string {
	return ts`    <div class="params">
        <h5>Parameters</h5>
        <table>
${each(idx.allValues(op.parameters!), (p) => parameterRow(p), '\n')}
        </table>

${(op.formParams && op.consumes && op.consumes.length > 0) ? consumesLine(op.consumes) : SKIP}
    </div>`
}

function parameterRow(p: CodegenParameter): string {
	return ts`                <tr>
                    <td class="name">
                        ${e(p.name)}
                        ${p.required ? '<span class="type">Required</span>' : ''}
\t\t\t            ${p.deprecated ? '<strong class="parameter-label -deprecated">DEPRECATED</strong>' : ''}
                        ${p.examples ? '<a href="#" class="example-trigger">Examples</a>' : ''}
                    </td>
                    <td class="type">
${indent(datatype(p, '/schemas'), '                        ')}
${isCodegenArraySchema(p.schema) ? `                            <div class="collection-format">
                                (${p.encoding.explode ? 'exploded ' : ''}${e(p.encoding.style ?? '')}-style)
                            </div>` : SKIP}
                    </td>
                    <td class="in">${e(p.in)}</td>
                    <td class="desc">${md(p.description)}</td>
                </tr>
${p.examples ? examplesRow(p.examples) : SKIP}`
}

function examplesRow(examples: CodegenExamples): string {
	return ts`                    <tr class="examples">
                        <td colspan="4">
${each(idx.allValues(examples), (ex) => ts`                                <div class="example">
${maybe(ex.name, n => `                                        <p><strong>${e(n)}</strong></p>`)}
<pre>
${e(stringify(ex.valuePretty))}
</pre>
${maybe(ex.mediaType, mt => `                                        <p><span class="type">${e(mt.mediaType)}</span></p>`)}
                                </div>`, '\n')}
                        </td>
                    </tr>`
}

function consumesLine(consumes: CodegenMediaType[]): string {
	return `            <p>${each(consumes, (c) => `<span class="type">${e(c.mediaType)}</span> `, '')}</p>`
}
