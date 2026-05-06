import { camelCase as cmnCamelCase, capitalize as cmnCapitalize, pascalCase as cmnPascalCase } from '@openapi-generator-plus/generator-common'
import { snakeCase, constantCase, sentenceCase, capitalCase as ccCapitalCase } from 'change-case'
import pluralize from 'pluralize'
import { CodegenGenerator } from '@openapi-generator-plus/types'

/**
 * Convert a value to a string for use by the case helpers. Mirrors the legacy
 * Handlebars helper which accepted any value and coerced it.
 */
function toString(value: unknown): string {
	if (value === null) {
		return ''
	}
	if (value === undefined) {
		throw new Error('Case helper called with undefined value')
	}
	if (typeof value === 'string') {
		return value
	}
	if (typeof value === 'object') {
		return String(value)
	}
	if (typeof value === 'function') {
		return (value as { name?: string }).name || ''
	}
	return String(value)
}

/** Convert the given name to a class name using the generator's rules. */
export function className(generator: CodegenGenerator, name: unknown): string {
	return generator.toClassName(toString(name))
}

/** Convert the given name to a safe identifier using the generator's rules. */
export function identifier(generator: CodegenGenerator, name: unknown): string {
	return generator.toIdentifier(toString(name))
}

/** Convert the given name to a constant name using the generator's rules. */
export function constantName(generator: CodegenGenerator, name: unknown): string {
	return generator.toConstantName(toString(name))
}

/** Capitalize the first character of `value`. */
export function capitalize(value: unknown): string {
	return cmnCapitalize(toString(value))
}

/** Uppercase `value` (locale-aware). */
export function upperCase(value: unknown): string {
	return toString(value).toLocaleUpperCase()
}

/** Lowercase `value` (locale-aware). */
export function lowerCase(value: unknown): string {
	return toString(value).toLocaleLowerCase()
}

/** Camel case `value`. */
export function camelCase(value: unknown): string {
	return cmnCamelCase(toString(value))
}

/** Pascal case `value`. */
export function pascalCase(value: unknown): string {
	return cmnPascalCase(toString(value))
}

/** Snake case `value`. */
export function snakeCaseOf(value: unknown): string {
	return snakeCase(toString(value))
}

/** ALL_CAPS_SNAKE_CASE `value`. */
export function allCapsSnakeCase(value: unknown): string {
	return constantCase(toString(value))
}

/** Sentence case `value`. */
export function sentenceCaseOf(value: unknown): string {
	return sentenceCase(toString(value))
}

/** Capital Case `value`. */
export function capitalCase(value: unknown): string {
	return ccCapitalCase(toString(value))
}

/** Pluralise `value`. */
export function plural(value: unknown): string {
	return pluralize(toString(value))
}

/** Singularise `value`. */
export function singular(value: unknown): string {
	return pluralize.singular(toString(value))
}

export { snakeCaseOf as snakeCase, sentenceCaseOf as sentenceCase }
