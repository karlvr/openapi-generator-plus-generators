import { CodegenRootContext, CodegenGeneratorConstructor, CodegenGeneratorType } from '@openapi-generator-plus/types'
import { CodegenOptionsDocumentation } from './types'
import path from 'path'
import Handlebars from 'handlebars'
import { loadTemplates, emit, registerStandardHelpers } from '@openapi-generator-plus/handlebars-templates'
import { javaLikeGenerator } from '@openapi-generator-plus/java-like-generator-helper'
import { commonGenerator, compareHttpMethods } from '@openapi-generator-plus/generator-common'
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

export const createGenerator: CodegenGeneratorConstructor<CodegenOptionsDocumentation> = (context) => ({
	...context.baseGenerator(),
	...commonGenerator(),
	...javaLikeGenerator({}),
	generatorType: () => CodegenGeneratorType.DOCUMENTATION,
	toLiteral: (value, options, state) => {
		if (value === undefined) {
			return state.generator.toDefaultValue(undefined, options, state).literalValue
		}

		return `${value}`
	},
	toNativeType: ({ type, format }) => {
		if (type === 'string') {
			if (format) {
				return new context.NativeType(format, {
					wireType: 'string',
				})
			}
		} else if (type === 'integer') {
			if (format) {
				return new context.NativeType(format, {
					wireType: 'number',
				})
			}
		}

		return new context.NativeType(type, {
			wireType: null,
		})
	},
	toNativeObjectType: function({ modelNames }, state) {
		let modelName = ''
		for (const name of modelNames) {
			modelName += `.${state.generator.toClassName(name, state)}`
		}
		return new context.NativeType(modelName.substring(1))
	},
	toNativeArrayType: ({ componentNativeType }) => {
		return new context.NativeType(`${componentNativeType}[]`)
	},
	toNativeMapType: ({ keyNativeType, componentNativeType }) => {
		return new context.NativeType(`{ [name: ${keyNativeType}]: ${componentNativeType} }`)
	},
	toDefaultValue: (defaultValue, options, state) => {
		if (defaultValue !== undefined) {
			return {
				value: defaultValue,
				literalValue: state.generator.toLiteral(defaultValue, options, state),
			}
		}

		return { literalValue: 'undefined' }
	},
	options: (config): CodegenOptionsDocumentation => {
		return {
			customTemplatesPath: config.customTemplates && computeCustomTemplatesPath(config.configPath, config.customTemplates),
		}
	},
	operationGroupingStrategy: () => {
		return context.operationGroupingStrategies.addToGroupsByTagOrPath
	},

	watchPaths: (config) => {
		const result = [path.resolve(__dirname, '..', 'templates')]
		result.push(path.resolve(__dirname, '..', 'less'))
		result.push(path.resolve(__dirname, '..', 'static'))
		if (config.customTemplates) {
			result.push(computeCustomTemplatesPath(config.configPath, config.customTemplates))
		}
		return result
	},

	cleanPathPatterns: () => undefined,

	exportTemplates: async(outputPath, doc, state) => {
		const hbs = Handlebars.create()

		registerStandardHelpers(hbs, context, state)
		hbs.registerHelper('md', function(value: string) {
			if (typeof value === 'string') {
				return marked(value)
			} else {
				return value
			}
		})
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		hbs.registerHelper('eachSorted', function(this: object, context: Array<any> | object | Map<any, any>, options: Handlebars.HelperOptions) {
			if (!context) {
				return options.inverse(this)
			}

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			let collection: any[]
			if (context instanceof Map) {
				collection = [...context.values()]
			} else if (Array.isArray(context)) {
				collection = context
			} else if (typeof context === 'object') {
				collection = []
				for (const key in context) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					collection.push((context as any)[key])
				}
			} else {
				collection = [context]
			}
			
			let result = ''
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			for (const item of collection.sort(function(a: any, b: any) {
				if (a === b) {
					return 0
				}
				if (typeof a === 'string' && typeof b === 'string') {
					return a.localeCompare(b)
				} else if (typeof a === 'number' && typeof b === 'number') {
					return a < b ? -1 : a > b ? 1 : 0
				} else if (typeof a === 'object' && typeof b === 'object') {
					if (a === null) {
						return 1
					} else if (b === null) {
						return -1
					}
					
					if (a.httpMethod && b.httpMethod) {
						/* Sort CodegenOperations by http method and then by name */
						const result = compareHttpMethods(a.httpMethod, b.httpMethod)
						if (result !== 0) {
							return result
						}
					}
					
					if (a.name && b.name) {
						return a.name.localeCompare(b.name)
					}

					return 0
				} else {
					return 0
				}
			})) {
				result += options.fn(item)
			}
			return result
		})
		hbs.registerHelper('htmlId', function(value: string) {
			if (value !== undefined) {
				return `${value}`.replace(/[^-a-zA-Z0-9_]+/g, '_').replace(/^_+/, '').replace(/_+$/, '')
			} else {
				return value
			}
		})

		await loadTemplates(path.resolve(__dirname, '..', 'templates'), hbs)

		if (state.options.customTemplatesPath) {
			await loadTemplates(state.options.customTemplatesPath, hbs)
		}

		const rootContext: CodegenRootContext = {
			generatorClass: '@openapi-generator-plus/plain-documentation-generator',
			generatedDate: new Date().toISOString(),
		}

		if (!outputPath.endsWith('/')) {
			outputPath += '/'
		}

		await emit('index', path.join(outputPath, 'index.html'), { ...doc, ...state.options, ...rootContext }, true, hbs)

		emitLess('style.less', path.join(outputPath, 'main.css'))
		copyContents(path.resolve(__dirname, '..', 'static'), outputPath)
	},
})

export default createGenerator
