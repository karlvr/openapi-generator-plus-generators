import { CodegenContent, CodegenContentPropertyEncoding } from '@openapi-generator-plus/types'
import * as idx from '@openapi-generator-plus/indexed-type'
import { isArray, stringLiteral } from '@openapi-generator-plus/template-utils'
import { JavaModelContext, escapeString, getter } from '@openapi-generator-plus/java-jaxrs-generator-common'

/** The arguments to {@link multipartProperty} beyond the property encoding itself. */
export interface MultipartPropertyOptions {
	/** The variable name (or expression) containing the property's value. */
	propertyVar: string
	/** The variable name containing the list of body parts being built. */
	bodyPartsVar: string
	content: CodegenContent
	/** The schema usage for this value (the array's component, if the property is an array; the property itself otherwise). */
	schemaUsage: { nullable: boolean }
}

/**
 * One multipart property's contribution to the outgoing request body: an
 * `AttachmentBuilder` addition to `bodyPartsVar`. Renders starting at column 0, with its
 * own one-tab-indented continuation lines baked in (the caller supplies any further
 * indentation for its own nesting).
 */
export function multipartProperty(entry: CodegenContentPropertyEncoding, opts: MultipartPropertyOptions, ctx: JavaModelContext): string {
	const { property, valueProperty, headerProperties } = entry
	const generator = ctx.generatorContext.generator()
	const useLombok = ctx.root.useLombok

	/* We don't make array components into Optionals. */
	const nullable = opts.schemaUsage.nullable && !isArray(property)
	const objectArg = nullable
		? `!${opts.propertyVar}.isPresent() ? null : ${opts.propertyVar}.get()`
		: opts.propertyVar
	const valueAccessor = valueProperty
		? `.${getter(valueProperty, generator, useLombok)}()${valueProperty.nullable ? '.orElse(null)' : ''}`
		: ''

	const idOrDisposition = opts.content.mediaType.mimeType === 'multipart/form-data'
		? `.contentDisposition(new org.apache.cxf.jaxrs.ext.multipart.ContentDisposition("form-data; name=\\"${escapeString(property.serializedName)}\\""))`
		: `.id(${stringLiteral(ctx.generatorContext, property.serializedName)})`

	const headerLines = headerProperties
		? idx.allKeys(headerProperties).map(key => {
			const headerProp = idx.get(headerProperties, key)!
			const accessor = `${opts.propertyVar}.${getter(headerProp, generator, useLombok)}()`
			return `\t.header(${stringLiteral(ctx.generatorContext, key)}, ${accessor} != null ? ${accessor}.toString() : null)\n`
		}).join('')
		: ''

	return `${opts.bodyPartsVar}.add(new org.apache.cxf.jaxrs.ext.multipart.AttachmentBuilder()\n`
		+ `\t.object(${objectArg}${valueAccessor})\n`
		+ `\t.mediaType(${stringLiteral(ctx.generatorContext, entry.contentType)})\n`
		+ `\t${idOrDisposition}\n`
		+ headerLines
		+ '\t.build());'
}
