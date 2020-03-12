import { pascalCase, GroupingStrategies, CodegenRootContext, CodegenGenerator, CodegenNativeType, InvalidModelError, CodegenMapTypePurpose, CodegenArrayTypePurpose } from '@openapi-generator-plus/core'
import { CodegenOptionsDocumentation } from './types'
import path from 'path'
import Handlebars from 'handlebars'
import pluralize from 'pluralize'
import { loadTemplates, emit, registerStandardHelpers } from '@openapi-generator-plus/handlebars-templates'
import { classCamelCase, identifierCamelCase } from '@openapi-generator-plus/java-like-generator-helper'
import marked from 'marked'
import { emit as emitLess } from './less-utils'
import { copyContents } from './static-utils'

function escapeString(value: string) {
	value = value.replace(/\\/g, '\\\\')
	value = value.replace(/'/g, '\\\'')
	return value
}

const generator: CodegenGenerator<CodegenOptionsDocumentation> = {
	toClassName: (name) => {
		return classCamelCase(name)
	},
	toIdentifier: (name) => {
		return identifierCamelCase(name)
	},
	toConstantName: (name) => {
		return pascalCase(name)
	},
	toEnumName: (name) => {
		return classCamelCase(name) + 'Enum'
	},
	toOperationName: (path, method) => {
		return identifierCamelCase(`${method.toLocaleLowerCase()}_${path}`)
	},
	toModelNameFromPropertyName: (name, state) => {
		return state.generator.toClassName(pluralize.singular(name), state)
	},
	toLiteral: (value, { type, format, required }, state) => {
		if (value === undefined) {
			return state.generator.toDefaultValue(undefined, { type, format, required }, state)
		}

		switch (type) {
			case 'integer': {
				return `${value}`
			}
			case 'number': {
				return `${value}`
			}
			case 'string': {
				if (format === 'binary') {
					throw new Error(`Cannot format literal for type ${type} format ${format}`)
				} else if (format === 'date') {
					/* The date format should be an ISO date, and the timezone doesn't matter */
					return `new Date("${value}")`
				} else if (format === 'time') {
					/* Parse the date at 1/1/1970 with a local time (no trailing Z), so it's parsed in the client's locale */
					return `new Date("1970-01-01T${value}")`
				} else if (format === 'date-time') {
					/* The date-time format should be an ISO datetime with an offset timezone */
					return `new Date("${value}")`
				} else {
					return `'${escapeString(value)}'`
				}
			}
			case 'boolean':
				return !required ? `java.lang.Boolean.valueOf(${value})` : `${value}`
			case 'object':
			case 'file':
				throw new Error(`Cannot format literal for type ${type}`)
		}

		throw new Error(`Unsupported type name: ${type}`)
	},
	toNativeType: ({ type, format, modelNames }, state) => {
		/* See https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#data-types */
		switch (type) {
			case 'integer': {
				return new CodegenNativeType('number')
			}
			case 'number': {
				return new CodegenNativeType('number')
			}
			case 'string': {
				switch (format) {
					case 'date':
					case 'time':
					case 'date-time':
						/* We don't have a mapping library to convert incoming and outgoing JSON, so the rawType of dates is string */
						return new CodegenNativeType('Date', 'string')
					default:
						return new CodegenNativeType('string')
				}
			}
			case 'boolean': {
				return new CodegenNativeType('boolean')
			}
			case 'object': {
				if (modelNames) {
					let modelName = ''
					for (const name of modelNames) {
						modelName += `.${state.generator.toClassName(name, state)}`
					}
					return new CodegenNativeType(modelName.substring(1))
				} else {
					return new CodegenNativeType('object')
				}
			}
			case 'file': {
				/* JavaScript does have a File type, but it isn't supported by JSON serialization so we don't have a wireType */
				return new CodegenNativeType('File', null)
			}
		}

		throw new Error(`Unsupported type name: ${type}`)
	},
	toNativeArrayType: ({ componentNativeType, purpose }) => {
		if (purpose === CodegenArrayTypePurpose.PARENT) {
			throw new InvalidModelError()
		}
		return new CodegenNativeType(`${componentNativeType}[]`, `${componentNativeType.wireType}[]`)
	},
	toNativeMapType: ({ keyNativeType, componentNativeType, purpose }) => {
		if (purpose === CodegenMapTypePurpose.PARENT) {
			throw new InvalidModelError()
		}
		return new CodegenNativeType(`{ [name: ${keyNativeType}]: ${componentNativeType} }`, `{ [name: ${keyNativeType.wireType}]: ${componentNativeType.wireType} }`)
	},
	toDefaultValue: (defaultValue, { type, format, required }, state) => {
		if (defaultValue !== undefined) {
			return state.generator.toLiteral(defaultValue, { type, format, required }, state)
		}

		if (!required) {
			return 'undefined'
		}

		switch (type) {
			case 'integer':
			case 'number':
				return state.generator.toLiteral(0, { type, format, required }, state)
			case 'boolean':
				return 'false'
			case 'string':
			case 'object':
			case 'array':
			case 'file':
				return 'undefined'
		}

		throw new Error(`Unsupported type name: ${type}`)
	},
	options: (config): CodegenOptionsDocumentation => {
		return {
			config,
		}
	},
	operationGroupingStrategy: () => {
		return GroupingStrategies.addToGroupsByPath
	},

	exportTemplates: async(doc, state) => {
		const hbs = Handlebars.create()

		registerStandardHelpers(hbs, state)
		hbs.registerHelper('md', function(value: string) {
			if (typeof value === 'string') {
				return marked(value)
			} else {
				return value
			}
		})
		hbs.registerHelper('eachSorted', function(this: object, collection: Array<unknown>, options: Handlebars.HelperOptions) {
			if (collection) {
				let result = ''
				for (const item of collection.sort()) {
					result += options.fn(item)
				}
				return result
			} else {
				return options.inverse(this)
			}
		})
		hbs.registerHelper('htmlId', function(value: string) {
			if (value !== undefined) {
				return `${value}`.replace(/[^-a-zA-Z0-9_]/g, '_')
			} else {
				return value
			}
		})
		hbs.registerHelper('ifeq', function(this: object, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
			if (!options) {
				throw new Error('ifeq helper must be called with two arguments')
			}

			if (a == b) {
				return options.fn(this)
			} else {
				return options.inverse(this)
			}
		})
		hbs.registerHelper('ifcontains', function(this: object, haystack: unknown[], needle: unknown, options: Handlebars.HelperOptions) {
			if (!options) {
				throw new Error('ifcontains helper must be called with two arguments')
			}

			if (haystack && haystack.indexOf(needle) !== -1) {
				return options.fn(this)
			} else {
				return options.inverse(this)
			}
		})

		await loadTemplates(path.resolve(__dirname, '../templates'), hbs)

		const rootContext: CodegenRootContext = {
			generatorClass: '@openapi-generator-plus/plain-documentation-generator',
			generatedDate: new Date().toISOString(),
		}

		let outputPath = state.config.outputPath
		if (!outputPath.endsWith('/')) {
			outputPath += '/'
		}

		await emit('index', `${outputPath}index.html`, { ...doc, ...state.options, ...rootContext }, true, hbs)

		emitLess('style.less', `${outputPath}main.css`)
		copyContents(path.resolve(__dirname, '../static'), outputPath)
	},
}

export default generator
