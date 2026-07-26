import { CodegenObjectSchema, CodegenProperty, CodegenWrapperSchema, isCodegenWrapperSchema } from '@openapi-generator-plus/types'
import * as idx from '@openapi-generator-plus/indexed-type'
import { className, identifier, CodegenGenerator, SKIP, Skip } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from '../types'
import { isNativeArray } from '../helpers'

function equalsComparison(nativeType: CodegenProperty['nativeType'], nullable: boolean, thisAccess: string, otherAccess: string): string {
	const equals = isNativeArray(nativeType) ? 'java.util.Arrays.equals' : 'java.util.Objects.equals'
	const orElseNull = nullable ? '.orElse(null)' : ''
	return `${equals}(${thisAccess}${orElseNull}, ${otherAccess}${orElseNull})`
}

function equalsBody(schema: CodegenObjectSchema | CodegenWrapperSchema, wrapper: CodegenWrapperSchema | null, properties: CodegenProperty[] | null, name: string, otherName: string, generator: CodegenGenerator): string[] {
	if (wrapper) {
		const propName = identifier(generator, wrapper.property.name)
		return [
			`\t${name} ${otherName} = (${name}) o;`,
			`\treturn ${equalsComparison(wrapper.property.nativeType, wrapper.property.nullable, `this.${propName}`, `${otherName}.${propName}`)};`,
		]
	} else if (properties && properties.length > 0) {
		const comparisons = properties.map(p => {
			const propName = identifier(generator, p.name)
			return equalsComparison(p.nativeType, p.nullable, `this.${propName}`, `${otherName}.${propName}`)
		})
		return [
			`\t${name} ${otherName} = (${name}) o;`,
			`\treturn ${comparisons.join('\n\t\t\t&& ')};`,
		]
	} else {
		return ['\treturn true;']
	}
}

function hashCodeArgs(wrapper: CodegenWrapperSchema | null, properties: CodegenProperty[] | null, generator: CodegenGenerator): string {
	if (wrapper) {
		return `this.${identifier(generator, wrapper.property.name)}`
	}
	return (properties ?? []).map(p => `this.${identifier(generator, p.name)}`).join(', ')
}

function toStringBody(schema: CodegenObjectSchema | CodegenWrapperSchema, wrapper: CodegenWrapperSchema | null, properties: CodegenProperty[] | null, generator: CodegenGenerator): string[] {
	if (wrapper) {
		const propName = identifier(generator, wrapper.property.name)
		return [`\tsb.append("    ${propName}: ").append(java.util.Objects.toString(this.${propName}, "null").replace("\\n", "\\n    ")).append("\\n");`]
	}

	const lines = (properties ?? []).map(p => {
		const propName = identifier(generator, p.name)
		return `\tsb.append("    ${propName}: ").append(java.util.Objects.toString(this.${propName}, "null").replace("\\n", "\\n    ")).append("\\n");`
	})

	const objectSchema = schema as CodegenObjectSchema
	if (objectSchema.additionalProperties) {
		lines.push(
			'\tfor (java.lang.String key : additionalProperties.keySet()) {',
			'\t\tsb.append("    ").append(key).append(": ").append(java.util.Objects.toString(getAdditionalProperty(key), "null").replace("\\n", "\\n    ")).append("\\n");',
			'\t}',
		)
	}
	return lines
}

/**
 * `equals`, `hashCode` and `toString` implementations for a pojo or wrapper
 * class, generated when the class isn't using Lombok to provide them.
 */
export function pojoUtilities(schema: CodegenObjectSchema | CodegenWrapperSchema, ctx: JavaModelContext): string | Skip {
	if (ctx.root.useLombok) {
		return SKIP
	}
	const generator = ctx.generatorContext.generator()
	const name = className(generator, schema.name)
	const otherName = identifier(generator, schema.name)
	const wrapper = isCodegenWrapperSchema(schema) ? schema : null
	const properties = wrapper ? null : idx.allValues((schema as CodegenObjectSchema).properties ?? {})
	const hasParents = !!schema.parents

	return [
		'@java.lang.Override',
		'public boolean equals(java.lang.Object o) {',
		'\tif (this == o) {',
		'\t\treturn true;',
		'\t}',
		'\tif (o == null || getClass() != o.getClass()) {',
		'\t\treturn false;',
		'\t}',
		...(hasParents ? ['\tif (!super.equals(o)) {', '\t\treturn false;', '\t}'] : []),
		...equalsBody(schema, wrapper, properties, name, otherName, generator),
		'}',
		'',
		'@java.lang.Override',
		'public int hashCode() {',
		`\treturn ${hasParents ? '31 * super.hashCode() + ' : ''}java.util.Objects.hash(${hashCodeArgs(wrapper, properties, generator)});`,
		'}',
		'',
		'@java.lang.Override',
		'public java.lang.String toString() {',
		'\tjava.lang.StringBuilder sb = new java.lang.StringBuilder();',
		`\tsb.append("class ${name} {\\n");`,
		...(hasParents ? ['\tsb.append("    ").append(java.util.Objects.toString(super.toString(), "null").replace("\\n", "\\n    ")).append("\\n");'] : []),
		...toStringBody(schema, wrapper, properties, generator),
		'\tsb.append("}");',
		'\treturn sb.toString();',
		'}',
		'',
	].join('\n')
}
