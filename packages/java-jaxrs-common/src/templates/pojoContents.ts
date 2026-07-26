import { CodegenObjectSchema, CodegenProperty } from '@openapi-generator-plus/types'
import * as idx from '@openapi-generator-plus/indexed-type'
import { className, identifier, inheritedProperties, SKIP } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from './types'
import { nestedModels } from './nestedModels'
import { propertyDocumentation } from './frag/propertyDocumentation'
import { propertyStatusAnnotations } from './frag/propertyStatusAnnotations'
import { pojoPropertyAnnotations } from './frag/pojoPropertyAnnotations'
import { pojoPropertyType } from './frag/pojoPropertyType'
import { pojoProperty } from './frag/pojoProperty'
import { pojoUtilities } from './frag/pojoUtilities'

/** One property field declaration, followed by a blank line. */
function propertyField(property: CodegenProperty, ctx: JavaModelContext): string {
	const name = identifier(ctx.generatorContext.generator(), property.name)
	const initialValue = property.initialValue
		? ` = ${property.nullable ? `java.util.Optional.of(${property.initialValue.literalValue})` : property.initialValue.literalValue}`
		: ''
	const lines = [
		propertyDocumentation(property),
		pojoPropertyAnnotations(property, ctx),
		...(ctx.root.useLombok ? ['@lombok.Getter', '@lombok.Setter'] : []),
		`private ${pojoPropertyType(property)} ${name}${initialValue};`,
		'',
	]
	return lines.filter(line => line !== SKIP).join('\n') + '\n'
}

/** The additional-properties field declaration and its `@JsonAnyGetter`/`@JsonAnySetter` accessor methods. */
function additionalPropertiesSupport(schema: CodegenObjectSchema, name: string): string {
	const ap = schema.additionalProperties
	if (!ap) {
		return ''
	}
	return `@com.fasterxml.jackson.annotation.JsonAnyGetter
public ${ap.nativeType} getAdditionalProperties() {
	return additionalProperties;
}

public ${ap.component.nativeType} getAdditionalProperty(java.lang.String name) {
	if (additionalProperties != null) {
		return additionalProperties.get(name);
	} else {
		return null;
	}
}

@com.fasterxml.jackson.annotation.JsonAnySetter
public void put(java.lang.String name, ${ap.component.nativeType} value) {
	additionalProperties().put(name, value);
}

public void setAdditionalProperties(${ap.nativeType} additionalProperties) {
	this.additionalProperties = additionalProperties;
}

public ${ap.nativeType} additionalProperties() {
	if (additionalProperties == null) {
		additionalProperties = new ${ap.nativeType.concreteType}();
	}
	return additionalProperties;
}

public ${name} additionalProperties(${ap.nativeType} additionalProperties) {
	setAdditionalProperties(additionalProperties);
	return this;
}

`
}

/** Covariant chaining-setter overrides for properties inherited from a parent, so each returns this schema's own type. */
function inheritedPropertyOverrides(schema: CodegenObjectSchema, ctx: JavaModelContext): string {
	const generator = ctx.generatorContext.generator()
	return inheritedProperties(schema).map(property => {
		const name = identifier(generator, property.name)
		const lines = [
			propertyDocumentation(property),
			propertyStatusAnnotations(property),
			'@java.lang.Override',
			`public ${schema.nativeType} ${name}(${property.nativeType} ${name}) {`,
			`\tsuper.${name}(${name});`,
			'\treturn this;',
			'}',
			'',
		]
		return lines.filter(line => line !== SKIP).join('\n') + '\n'
	}).join('')
}

/** The own-property chaining setters, getters/setters and array convenience methods. */
function ownProperties(schema: CodegenObjectSchema, name: string, ctx: JavaModelContext): string {
	const properties = schema.properties ? idx.allValues(schema.properties) : []
	return properties.map(property => pojoProperty(property, name, ctx)).join('')
}

/**
 * The body of a pojo class: its nested models, property fields, no-args
 * constructor, additional-properties support, covariant overrides for
 * inherited chaining setters, and the properties' own chaining setters,
 * getters/setters and utility methods.
 */
export function pojoContents(schema: CodegenObjectSchema, ctx: JavaModelContext): string {
	const name = className(ctx.generatorContext.generator(), schema.name)
	const properties = schema.properties ? idx.allValues(schema.properties) : []

	const header = ctx.templates.pojoHeader(schema, ctx)
	const nested = nestedModels(schema, ctx)
	const utilities = pojoUtilities(schema, ctx)
	const footer = ctx.templates.pojoFooter(schema, ctx)

	const content = (header !== SKIP ? header + '\n' : '')
		+ (nested !== SKIP ? nested : '')
		+ additionalPropertiesFieldDeclaration(schema)
		+ properties.map(property => propertyField(property, ctx)).join('')
		+ `public ${name}() {\n\n}\n\n`
		+ additionalPropertiesSupport(schema, name)
		+ inheritedPropertyOverrides(schema, ctx)
		+ ownProperties(schema, name, ctx)
		+ (utilities !== SKIP ? utilities : '')
		+ (footer !== SKIP ? footer + '\n' : '')

	/* This content is embedded at "\t${...}\n}" in the enclosing class declaration
	   (see pojo.ts/pojoNested.ts), which itself supplies the newline before that
	   closing brace — so however many trailing blank lines the last-rendered
	   section left behind, exactly one trailing newline is what's needed here. */
	return content.replace(/\n+$/, '\n')
}

function additionalPropertiesFieldDeclaration(schema: CodegenObjectSchema): string {
	const ap = schema.additionalProperties
	if (!ap) {
		return ''
	}
	return `private ${ap.nativeType} additionalProperties = new ${ap.nativeType.concreteType}();\n`
}
