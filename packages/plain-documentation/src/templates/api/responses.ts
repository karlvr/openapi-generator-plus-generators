import { CodegenContent, CodegenMediaType, CodegenOperation, CodegenResponse } from '@openapi-generator-plus/types'
import { each, hasExamples, indent, maybe, md, SKIP, ts, when } from '@openapi-generator-plus/template-utils'
import * as idx from '@openapi-generator-plus/indexed-type'
import { e, stringify } from '../helpers'
import { datatype } from '../model/datatype'
import { modelPanel } from './model'

/** Render the "Response" section listing an operation's responses, if it has any. */
export function responsesSection(op: CodegenOperation): string {
	// responses.hbs opens with a comment followed by a blank line that is
	// present unconditionally, regardless of whether there are responses.
	return ts`

${when(op.responses, () => responsesBlock(idx.allValues(op.responses!), op.produces))}`
}

function responsesBlock(responses: CodegenResponse[], produces: CodegenMediaType[] | null): string {
	return ts`    <div class="response">
        <h5>Response</h5>

        <table>
${each(responses, (r) => responseRow(r), '\n')}
        </table>

${produces && produces.length > 0 ? producesLine(produces) : SKIP}

${each(responses, (r) => (r.defaultContent && r.defaultContent.schema && r.defaultContent.schema.anonymous) ? indent(modelPanel(r.defaultContent.schema, '/schemas'), '        ') : SKIP, '\n')}
    </div>`
}

function responseRow(r: CodegenResponse): string {
	return ts`                <tr>
                    <td class="code">${e(stringify(r.code))} ${hasExamples(r) ? '<a href="#" class="example-trigger">Examples</a>' : ''}</td>
                    <td class="resp">${md(r.description)}</td>
                    <td class="desc">${responseTypeCell(r)}</td>
                </tr>
${hasExamples(r) ? examplesRow(r.contents ?? []) : SKIP}`
}

function responseTypeCell(r: CodegenResponse): string {
	if (!r.defaultContent) {
		return ''
	}
	if (!r.defaultContent.schema) {
		return '<em>Undocumented</em>'
	}
	// The mid-line `{{>model/datatype}}` reference carries its partial's
	// trailing newline (from the end of the template file) into the output,
	// which is why `</td>` ends up on its own line here.
	return `${datatype({ schema: r.defaultContent.schema, nativeType: r.defaultContent.nativeType! }, '/schemas')}\n`
}

function examplesRow(contents: CodegenContent[]): string {
	return ts`                    <tr class="examples">
                        <td colspan="3">
${each(contents, (c) => each(c.examples ? idx.allValues(c.examples) : [], (ex) => ts`                                <div class="example">
${maybe(ex.name, n => `                                        <p><strong>${e(n)}</strong></p>`)}
<pre>
${e(stringify(ex.valuePretty))}
</pre>
${maybe(ex.mediaType, mt => `                                        <p><span class="type">${e(mt.mediaType)}</span></p>`)}
                                </div>`, '\n'), '\n')}
                        </td>
                    </tr>`
}

function producesLine(produces: CodegenMediaType[]): string {
	return `        <p>${each(produces, (c) => `<span class="type">${e(c.mediaType)}</span> `, '')}</p>`
}
