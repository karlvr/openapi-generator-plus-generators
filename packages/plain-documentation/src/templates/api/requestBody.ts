import { CodegenContent, CodegenMediaType, CodegenOperation, CodegenRequestBody } from '@openapi-generator-plus/types'
import { each, hasExamples, indent, maybe, md, SKIP, ts, when } from '@openapi-generator-plus/template-utils'
import * as idx from '@openapi-generator-plus/indexed-type'
import { e, stringify } from '../helpers'
import { datatype } from '../model/datatype'
import { modelPanel } from './model'

/** Render the "Request" section describing an operation's request body, if it has one. */
export function requestBodySection(op: CodegenOperation): string {
	// request-body.hbs opens with a comment followed by a blank line that is
	// present unconditionally, regardless of whether there is a request body.
	return ts`

${when(op.requestBody, () => requestBodyBlock(op.requestBody!, op.consumes))}`
}

function requestBodyBlock(rb: CodegenRequestBody, consumes: CodegenMediaType[] | null): string {
	return ts`    <div class="request">
        <h5>Request</h5>
            ${md(rb.description)}

${schemaBlock(rb)}

${when(hasExamples(rb), () => examplesBlock(rb.contents))}

${consumes && consumes.length > 0 ? consumesLine(consumes) : SKIP}
    </div>`
}

function schemaBlock(rb: CodegenRequestBody): string {
	if (!rb.schema) {
		return '            <p class="meta"><em>Undocumented</em></p>'
	}
	if (rb.schema.anonymous) {
		return indent(modelPanel(rb.schema, '/schemas', true), '            ')
	}
	// The mid-line `{{>model/datatype}}` reference carries its partial's
	// trailing newline (from the end of the template file) into the output,
	// which is why `</p>` ends up on its own line, unindented.
	return `            <p class="meta">${datatype({ schema: rb.schema, nativeType: rb.nativeType!, defaultValue: rb.defaultValue }, '/schemas')}
</p>`
}

function examplesBlock(contents: CodegenContent[]): string {
	return ts`                <p><a href="#" class="example-trigger">Examples</a></p>
                <div class="examples">
${each(contents, (c) => each(c.examples ? idx.allValues(c.examples) : [], (ex) => ts`${maybe(ex.name, n => `                            <p><strong>${e(n)}</strong></p>`)}
<pre>
${e(stringify(ex.valuePretty))}
</pre>
${maybe(ex.mediaType, mt => `                            <p><span class="type">${e(mt.mediaType)}</span></p>`)}`, '\n'), '\n')}
                </div>`
}

function consumesLine(consumes: CodegenMediaType[]): string {
	return `            <p>${each(consumes, (c) => `<span class="type">${e(c.mediaType)}</span> `, '')}</p>`
}
