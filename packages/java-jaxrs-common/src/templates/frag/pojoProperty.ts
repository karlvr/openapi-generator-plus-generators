import { CodegenProperty, isCodegenArraySchema, isCodegenObjectSchema } from '@openapi-generator-plus/types'
import { identifier, capitalize, singular, isObject, isMap, isArray, Skip, SKIP } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from '../types'
import { getter, setter } from '../helpers'
import { propertyDocumentation } from './propertyDocumentation'
import { propertyStatusAnnotations } from './propertyStatusAnnotations'
import { pojoPropertyType } from './pojoPropertyType'

/** Drop SKIP entries (a hook/fragment with nothing to render) while keeping literal blank-line separators, then join with newlines. */
function stackLines(lines: (string | Skip)[]): string {
	return lines.filter((line): line is string => line !== SKIP).join('\n')
}

/** The chaining setter that assigns `property` and returns `this`, for use in a builder-style call chain. */
function chainingSetter(property: CodegenProperty, chainClassName: string, name: string, ctx: JavaModelContext): string {
	const generator = ctx.generatorContext.generator()
	const setterCall = property.nullable
		? `${setter(property, generator, ctx.root.useLombok)}(${name} != null ? java.util.Optional.of(${name}) : java.util.Optional.empty());`
		: `${setter(property, generator, ctx.root.useLombok)}(${name});`
	return stackLines([
		propertyDocumentation(property),
		propertyStatusAnnotations(property),
		`public ${chainClassName} ${name}(${property.nativeType} ${name}) {`,
		`\t${setterCall}`,
		'\treturn this;',
		'}',
		'',
	]) + '\n'
}

/** The "get or create" accessor for an object/array/map-valued property, which never returns null. */
function getOrCreateAccessor(property: CodegenProperty, name: string): string {
	if (!isObject(property) && !isMap(property) && !isArray(property)) {
		return ''
	}
	const nativeType = property.nativeType
	const body = property.nullable
		? [
			`\tif (this.${name} == null || !this.${name}.isPresent()) {`,
			`\t\tthis.${name} = java.util.Optional.of(new ${nativeType.concreteType}());`,
			'\t}',
			`\treturn this.${name}.get();`,
		]
		: [
			`\tif (this.${name} == null) {`,
			`\t\tthis.${name} = new ${nativeType.concreteType}();`,
			'\t}',
			`\treturn this.${name};`,
		]
	return stackLines([
		'/**',
		` * Returns the ${name}, or if it's {@code null} it first creates a new object,`,
		' * sets the property to the new object, and then returns it.',
		' */',
		propertyStatusAnnotations(property),
		`public ${nativeType} ${name}() {`,
		...body,
		'}',
		'',
	]) + '\n'
}

/** The plain getter/setter pair, when the generator isn't using Lombok to generate them. */
function getterSetterPair(property: CodegenProperty, name: string, ctx: JavaModelContext): string {
	if (ctx.root.useLombok) {
		return ''
	}
	const generator = ctx.generatorContext.generator()
	return stackLines([
		`public ${pojoPropertyType(property)} ${getter(property, generator, ctx.root.useLombok)}() {`,
		`\treturn this.${name};`,
		'}',
		'',
		propertyStatusAnnotations(property),
		`public void ${setter(property, generator, ctx.root.useLombok)}(${pojoPropertyType(property)} ${name}) {`,
		`\tthis.${name} = ${name};`,
		'}',
		'',
	]) + '\n'
}

/** The array convenience `add*` methods, for array-valued properties. */
function arrayAddMethods(property: CodegenProperty, chainClassName: string, name: string, ctx: JavaModelContext): string {
	if (!isCodegenArraySchema(property.schema)) {
		return ''
	}
	const nativeType = property.nativeType
	const component = property.schema.component
	/* The method name singularizes the already-safe identifier (matching the
	   original `capitalize (singular (identifier name))`), but the parameter
	   itself singularizes the raw property name first and only then makes it
	   identifier-safe (`identifier (singular name)`) — these can differ, e.g.
	   "bytes" (identifier "bytes") singularizes to "byte" for the method name,
	   but the raw name singularizes to "byte" too, which is a reserved word and
	   so becomes "aByte" once escaped. */
	const addName = `add${capitalize(singular(name))}`
	const paramName = identifier(ctx.generatorContext.generator(), singular(property.name))

	const addOne = property.nullable
		? [
			`\tif (this.${name} == null || !this.${name}.isPresent()) {`,
			`\t\tthis.${name} = java.util.Optional.of(new ${nativeType.concreteType}());`,
			'\t}',
			`\tthis.${name}.get().add(${paramName});`,
		]
		: [
			`\tif (this.${name} == null) {`,
			`\t\tthis.${name} = new ${nativeType.concreteType}();`,
			'\t}',
			`\tthis.${name}.add(${paramName});`,
		]

	const lines: (string | Skip)[] = [
		propertyStatusAnnotations(property),
		`public ${chainClassName} ${addName}(${component.nativeType} ${paramName}) {`,
		...addOne,
		'\treturn this;',
		'}',
		'',
	]

	if (isCodegenObjectSchema(component.schema)) {
		lines.push(
			propertyStatusAnnotations(property),
			`public ${component.nativeType} ${addName}() {`,
			`\t${component.nativeType} ${paramName} = new ${component.nativeType.concreteType}();`,
			`\t${addName}(${paramName});`,
			`\treturn ${paramName};`,
			'}',
			'',
		)
	}

	return stackLines(lines) + '\n'
}

/**
 * The chaining setter (returns `this`), and — unless the property's schema is
 * object/array/map-valued which gets a "get or create" accessor instead — the
 * plain getter/setter pair (when not using Lombok) and array convenience
 * `add*` methods for a property.
 */
export function pojoProperty(property: CodegenProperty, chainClassName: string, ctx: JavaModelContext): string {
	const name = identifier(ctx.generatorContext.generator(), property.name)
	return chainingSetter(property, chainClassName, name, ctx)
		+ getOrCreateAccessor(property, name)
		+ getterSetterPair(property, name, ctx)
		+ arrayAddMethods(property, chainClassName, name, ctx)
}
