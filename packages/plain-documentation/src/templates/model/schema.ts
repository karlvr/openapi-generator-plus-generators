import {
	CodegenAllOfSchema,
	CodegenDiscriminator,
	CodegenEnumSchema,
	CodegenExamples,
	CodegenInterfaceSchema,
	CodegenObjectSchema,
	CodegenOneOfSchema,
	CodegenProperties,
	CodegenScope,
	CodegenSchema,
	isCodegenAllOfSchema,
	isCodegenEnumSchema,
	isCodegenInterfaceSchema,
	isCodegenObjectSchema,
	isCodegenOneOfSchema,
	isCodegenScope,
} from '@openapi-generator-plus/types'
import { each, join, maybe, md, Skip, SKIP, ts, when, indent } from '@openapi-generator-plus/template-utils'
import * as idx from '@openapi-generator-plus/indexed-type'
import { e, htmlId, indentBlock, stringify } from '../helpers'
import { datatype } from './datatype'

/**
 * A schema-like value that can appear in an inheritance chain: it may have
 * its own parents (of the same shape) and its own direct properties. Both
 * object schemas and interface schemas satisfy this shape.
 */
interface InheritanceSource {
	parents: InheritanceSource[] | null
	properties: CodegenProperties | null
}

/**
 * Render a schema inside its documentation panel: an anchor and heading
 * (unless suppressed), followed by the schema's own body.
 */
export function mainPanel(schema: CodegenSchema, anchor: string | undefined, hideName?: boolean): string {
	// main-panel.hbs opens with a comment; the blank line that originally
	// followed it survives into the rendered output.
	return ts`

                <section class="summary" data-class-title="${e(schema.name ?? '')}">
                    ${anchor ? `<a name="${anchor}/${htmlId(schema.nativeType)}"></a>` : ''}
${titleBlock(schema, hideName)}

${indent(body(schema, anchor), '                    ')}
                </section>`
}

function titleBlock(schema: CodegenSchema, hideName: boolean | undefined): string | Skip {
	if (hideName || !schema.name) {
		return SKIP
	}
	return `                        <h3 class="schema-title">
                            ${e(String(schema.nativeType))}
                            ${isCodegenInterfaceSchema(schema) ? '<span class="type">INTERFACE</span>' : ''}
                            ${isCodegenEnumSchema(schema) ? '<span class="type">ENUM</span>' : ''}
                        </h3>`
}

/**
 * A schema variant that carries examples: object, interface, enum and
 * composition schemas all may, though the shared {@link CodegenSchema} base
 * doesn't declare the field since not every schema kind has it.
 */
interface SchemaWithExamples {
	examples?: CodegenExamples | null
}

/** Render a schema's own content, without the surrounding panel chrome. */
export function body(schema: CodegenSchema, anchor: string | undefined): string {
	const examples = (schema as SchemaWithExamples).examples
	return ts`
${maybe(schema.description, d => `    <section class="model-description">
        ${md(d)}
    </section>`)}
${examples ? each(idx.allValues(examples), (ex) => ts`        <div class="model-example">
${maybe(ex.name, n => `                <p><strong>${e(n)}</strong></p>`)}
            <pre>
            ${e(stringify(ex.valuePretty))}
            </pre>
${maybe(ex.mediaType, mt => `                <p><span class="type">${e(mt.mediaType)}</span></p>`)}
        </div>`, '\n') : SKIP}

${isCodegenObjectSchema(schema) ? indent(objectModel(schema, anchor), '    ') : SKIP}
${isCodegenInterfaceSchema(schema) ? indent(interfaceModel(schema, anchor), '    ') : SKIP}
${isCodegenEnumSchema(schema) ? indent(enumModel(schema), '    ') : SKIP}
${isCodegenAllOfSchema(schema) ? indent(allOfModel(schema, anchor), '    ') : SKIP}
${isCodegenOneOfSchema(schema) ? indent(oneOfModel(schema, anchor), '    ') : SKIP}`
}

function objectModel(schema: CodegenObjectSchema, anchor: string | undefined): string {
	const nestedSchemas = schema.schemas ? idx.allValues(schema.schemas) : []
	return ts`
${schema.parents && schema.parents.length > 0 ? each(schema.parents, (p) => indent(inherited(p, anchor), '    '), '\n') : SKIP}

${schema.implements && schema.implements.length > 0 ? indent(implementsBlock(schema.implements, anchor), '    ') : SKIP}

${when(schema.properties, () => indent(properties(schema.properties!, anchor), '    '))}

${when(schema.discriminator, () => indent(discriminatorSection(schema.discriminator!, anchor), '    '))}

${schema.children && schema.children.length > 0 ? indent(childrenBlock(schema.children, anchor), '    ') : SKIP}

${each(nestedSchemas, (s) => s.anonymous ? SKIP : indent(mainPanel(s, anchor), '    '), '\n')}`
}

function interfaceModel(schema: CodegenInterfaceSchema, anchor: string | undefined): string {
	const nestedSchemas = schema.schemas ? idx.allValues(schema.schemas) : []
	return ts`<div class="interface">
    <h4>Implemented by</h4>
    <div class="detail">
${each(schema.implementors ?? [], (i) => `            <p><a class="model-ref" href="#${anchor}/${htmlId(i.nativeType)}">${e(String(i.nativeType))}</a></p>`, '\n')}
    </div>

${when(schema.properties, () => `        <div class="params -inherited-properties">
            <h4>Inherited Properties</h4>
            <table>
${indentBlock(fragInherited(schema, anchor), '                ')}
            </table>
        </div>`)}

${each(nestedSchemas, (s) => indent(mainPanel(s, anchor), '        '), '\n')}
</div>`
}

function enumModel(schema: CodegenEnumSchema): string {
	const values = schema.enumValues ? idx.allValues(schema.enumValues) : []
	return ts`<div class="values -enum">
\t<h4>Values</h4>
\t<ul class="model-property-enum">
${each(values, (v) => `\t\t\t<li class="model-property-enum-item" title="${e(v.literalValue)}">${e(v.name)}${v.description ? ` <span class="model-property-enum-item-description">${md(v.description)}</span>` : ''}</li>`, '\n')}
\t</ul>
</div>`
}

function allOfModel(schema: CodegenAllOfSchema, anchor: string | undefined): string {
	const composes = schema.composes
	const anonymousComposes = composes.filter((c): c is CodegenObjectSchema => isCodegenObjectSchema(c) && !!c.anonymous)
	return ts`<div class="all-of">
    <h4>All of</h4>
    <div class="detail">
${each(composes, (c) => c.anonymous ? SKIP : `            <p><a class="model-ref" href="#${anchor}/${htmlId(c.nativeType)}">${e(String(c.nativeType))}</a></p>`, '\n')}
    </div>

${when(schema.discriminator, () => indent(discriminatorSection(schema.discriminator!, anchor), '    '))}


${anonymousComposes.length > 0 ? `            <div class="params -properties">
                <h5>Properties</h5>
                <table>

${each(anonymousComposes, (c) => c.properties ? indentBlock(fragProperties(c.properties, anchor), '            ') : SKIP, '\n')}
                </table>
            </div>` : SKIP}

${nestedSubSchemas(schema, anchor)}
</div>`
}

function oneOfModel(schema: CodegenOneOfSchema, anchor: string | undefined): string {
	const nestedSchemas = schema.schemas ? idx.allValues(schema.schemas) : []
	return ts`<div class="one-of">
    <h4>One of</h4>
    <div class="detail">
${each(schema.composes, (c) => `            <p><a class="model-ref" href="#${anchor}/${htmlId(c.nativeType)}">${e(String(c.nativeType))}</a></p>`, '\n')}
    </div>

${when(schema.discriminator, () => indent(discriminatorSection(schema.discriminator!, anchor), '    '))}

${each(nestedSchemas, (s) => indent(mainPanel(s, anchor), '        '), '\n')}
</div>`
}

/**
 * The composition schemas (allOf/oneOf) render their own scoped schemas only
 * one level removed: not the immediately-composed anonymous schemas (which
 * are absorbed into the composing schema's own properties table) but any
 * further schemas nested inside those.
 */
function nestedSubSchemas(schema: CodegenScope, anchor: string | undefined): string | Skip {
	const ownSchemas = schema.schemas ? idx.allValues(schema.schemas) : []
	return each(ownSchemas, (item) => {
		const nested = isCodegenScope(item) && item.schemas ? idx.allValues(item.schemas) : []
		return each(nested, (n) => indent(mainPanel(n, anchor), '                '), '\n')
	}, '\n')
}

function discriminatorSection(discriminator: CodegenDiscriminator, anchor: string | undefined): string {
	return ts`<div class="params -discriminator">
    <h4>Discriminator</h4>
\t<div class="params -properties">
\t\t<table>
\t\t\t<thead>
\t\t\t\t<tr>
\t\t\t\t\t<th>Name</th>
\t\t\t\t\t<th>Type</th>
\t\t\t\t</tr>
\t\t\t</thead>
\t\t\t<tr data-property-name="${e(discriminator.name)}">
\t\t\t\t<td class="name">
\t\t\t\t\t${e(discriminator.serializedName)}
\t\t\t\t\t${discriminator.required ? '<span class="type">Required</span>' : ''}
\t\t\t\t</td>
\t\t\t\t<td class="type">
${indent(datatype(discriminator, anchor), '\t\t\t\t\t')}
\t\t\t\t</td>
\t\t\t\t<td class="desc">
\t\t\t\t\t${md(discriminator.description)}
\t\t\t\t</td>
\t\t\t</tr>
\t\t</table>
\t</div>

\t<h5>Values</h5>
\t<div class="params -properties">
\t\t<table>
\t\t\t<thead>
\t\t\t\t<tr>
\t\t\t\t\t<th>Value</th>
\t\t\t\t\t<th>Reference</th>
\t\t\t\t</tr>
\t\t\t</thead>
\t\t\t<tbody>
${each(discriminator.references, (r) => `\t\t\t\t<tr>
\t\t\t\t\t<td>${e(r.value)}</td>
\t\t\t\t\t<td><a class="model-ref" href="#${anchor ?? ''}/${htmlId(r.schema.nativeType)}">${e(String(r.schema.nativeType))}</a></td>
\t\t\t\t</tr>`, '\n')}
\t\t\t</tbody>
\t\t</table>
\t</div>
</div>`
}

function childrenBlock(children: CodegenObjectSchema[], anchor: string | undefined): string {
	// children.hbs opens with a comment; the blank line that originally
	// followed it survives into the rendered output.
	return ts`

<div class="children">
    <h4>Children</h4>
    <div class="detail">
${each(children, (c) => `            <p><a class="model-ref" href="#${anchor}/${htmlId(c.nativeType)}">${e(String(c.nativeType))}</a></p>`, '\n')}
    </div>
</div>`
}

function implementsBlock(implementsList: CodegenInterfaceSchema[], anchor: string | undefined): string {
	// implements.hbs opens with a comment; the blank line that originally
	// followed it survives into the rendered output.
	return ts`

<div class="implements">
    <h4>Implements</h4>
    <div class="detail">
${each(implementsList, (i) => `            <p><a class="model-ref" href="#${anchor}/${htmlId(i.nativeType)}">${e(String(i.nativeType))}</a></p>`, '\n')}
    </div>
</div>`
}

function inherited(parent: CodegenObjectSchema, anchor: string | undefined): string {
	// inherited.hbs opens with a comment; the blank line that originally
	// followed it survives into the rendered output.
	return ts`

<div class="parent">
    <h4>Parent</h4>
    <div class="detail">
        <p><a class="model-ref" href="#${anchor ?? ''}/${htmlId(parent.nativeType)}">${e(String(parent.nativeType))}</a></p>
    </div>

${when(parent.properties, () => `        <div class="params -inherited-properties">
            <h4>Inherited Properties</h4>
            <table>
${indentBlock(fragInherited(parent, anchor), '                ')}
            </table>
        </div>`)}
</div>`
}

function properties(props: CodegenProperties, anchor: string | undefined): string {
	return ts`<div class="params -properties">
    <h4>Properties</h4>
    <table>
${indentBlock(fragProperties(props, anchor), '        ')}
    </table>
</div>`
}

/**
 * Render the inherited-properties table body for a schema: its parents'
 * inherited properties (recursively) followed by its own direct properties.
 */
function fragInherited(schema: InheritanceSource, anchor: string | undefined): string | Skip {
	return join([
		schema.parents ? each(schema.parents, (p) => fragInherited(p, anchor), '\n') : SKIP,
		schema.properties ? fragProperties(schema.properties, anchor) : SKIP,
	], '\n')
}

/** Render one property-table row per property. */
function fragProperties(props: CodegenProperties, anchor: string | undefined): string | Skip {
	return each(idx.allValues(props), (p) => `\t<tr data-property-name="${e(p.name)}">
\t\t<td class="name">
\t\t\t${e(p.name)}
\t\t\t${p.required ? '<span class="type">Required</span>' : ''}
\t\t\t${p.deprecated ? '<strong class="property-label -deprecated">DEPRECATED</strong>' : ''}
\t\t</td>
\t\t<td class="type">
${indent(datatype(p, anchor), '\t\t\t')}
\t\t</td>
\t\t<td class="desc">
\t\t\t${md(p.description)}
\t\t</td>
\t</tr>`, '\n')
}
