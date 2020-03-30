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

function computeCustomTemplatesPath(configPath: string | undefined, customTemplatesPath: string) {
	if (configPath) {
		return path.resolve(path.dirname(configPath), customTemplatesPath) 
	} else {
		return customTemplatesPath
	}
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
	toLiteral: (value, options, state) => {
		if (value === undefined) {
			return state.generator.toDefaultValue(undefined, options, state)
		}

		return value
	},
	toNativeType: ({ type, format, modelNames }, state) => {
		if (type === 'object') {
			if (modelNames) {
				let modelName = ''
				for (const name of modelNames) {
					modelName += `.${state.generator.toClassName(name, state)}`
				}
				return new CodegenNativeType(modelName.substring(1))
			}
		} else if (type === 'string') {
			if (format) {
				return new CodegenNativeType(format, {
					wireType: 'string',
				})
			}
		} else if (type === 'integer') {
			if (format) {
				return new CodegenNativeType(format, {
					wireType: 'number',
				})
			}
		}

		return new CodegenNativeType(type, {
			wireType: null,
		})
	},
	toNativeArrayType: ({ componentNativeType, purpose }) => {
		if (purpose === CodegenArrayTypePurpose.PARENT) {
			throw new InvalidModelError()
		}
		return new CodegenNativeType(`${componentNativeType}[]`)
	},
	toNativeMapType: ({ keyNativeType, componentNativeType, purpose }) => {
		if (purpose === CodegenMapTypePurpose.PARENT) {
			throw new InvalidModelError()
		}
		return new CodegenNativeType(`{ [name: ${keyNativeType}]: ${componentNativeType} }`)
	},
	toDefaultValue: (defaultValue, options, state) => {
		if (defaultValue !== undefined) {
			return state.generator.toLiteral(defaultValue, options, state)
		}

		return 'undefined'
	},
	options: (config): CodegenOptionsDocumentation => {
		return {
			config,
		}
	},
	operationGroupingStrategy: () => {
		return GroupingStrategies.addToGroupsByTagOrPath
	},

	watchPaths: (config) => {
		const result = [path.resolve(__dirname, '../templates')]
		result.push(path.resolve(__dirname, '../less'))
		result.push(path.resolve(__dirname, '../static'))
		if (config.customTemplates) {
			result.push(computeCustomTemplatesPath(config.configPath, config.customTemplates))
		}
		return result
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
				for (const item of collection.sort(function(a: unknown, b: unknown) {
					if (a === b) {
						return 0
					}
					if (typeof a === 'string' && typeof b === 'string') {
						return a.localeCompare(b)
					} else if (typeof a === 'object' && typeof b === 'object') {
						if (a === null) {
							return 1
						} else if (b === null) {
							return -1
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						} else if ((a as any).name && (b as any).name) {
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							return (a as any).name.localeCompare((b as any).name)
						} else {
							return 0
						}
					} else {
						return 0
					}
				})) {
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

		if (state.config.customTemplates) {
			const customTemplatesPath = computeCustomTemplatesPath(state.config.configPath, state.config.customTemplates)
			await loadTemplates(customTemplatesPath, hbs)
		}

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
