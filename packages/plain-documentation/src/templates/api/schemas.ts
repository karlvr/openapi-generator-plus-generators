import { CodegenNamedSchemas } from '@openapi-generator-plus/types'
import { each, indent, SKIP, ts } from '@openapi-generator-plus/template-utils'
import * as idx from '@openapi-generator-plus/indexed-type'
import { sorted } from '../helpers'
import { modelPanel } from './model'

/** Render the "Schemas" article listing every named schema in the document. */
export function schemasSection(schemas: CodegenNamedSchemas, navStyle: 'name' | 'full-path'): string {
	// schemas.hbs opens with a comment followed by a blank line.
	return ts`

<article id="schemas" class="content">
\t<h2>Schemas</h2>

${each(sorted(idx.allValues(schemas), navStyle), (s) => s.anonymous ? SKIP : indent(modelPanel(s, '/schemas'), '\t\t'), '\n')}
</article>`
}
