import { CodegenAllOfStrategy, CodegenAnyOfStrategy, CodegenGeneratorConstructor, CodegenGeneratorType, CodegenOneOfStrategy } from '@openapi-generator-plus/types'
import { CodegenOptionsDocumentation } from './types'
import path from 'path'
import Handlebars from 'handlebars'
import { loadTemplates, emit, registerStandardHelpers } from '@openapi-generator-plus/handlebars-templates'
import { javaLikeGenerator, JavaLikeContext, ConstantStyle, options as javaLikeOptions } from '@openapi-generator-plus/java-like-generator-helper'
import { commonGenerator, compareHttpMethods, configString } from '@openapi-generator-plus/generator-common'
import { emit as emitLess } from './less-utils'
import { copyContents } from './static-utils'

function computeCustomTemplatesPath(configPath: string | undefined, customTemplatesPath: string) {
	if (configPath) {
		return path.resolve(path.dirname(configPath), customTemplatesPath) 
	} else {
		return customTemplatesPath
	}
}

function toSafeTypeForComposing(nativeType: string): string {
	if (/[^a-zA-Z0-9_.[\]]/.test(nativeType)) {
		return `(${nativeType})`
	} else {
		return nativeType
	}
}

export const createGenerator: CodegenGeneratorConstructor = (config, context) => {
	const javaLikeContext: JavaLikeContext = {
		...context,
		defaultConstantStyle: ConstantStyle.allCapsSnake,
	}
	
	const customTemplates = configString(config, 'customTemplates', undefined)
	const generatorOptions: CodegenOptionsDocumentation = {
		...javaLikeOptions(config, javaLikeContext),
		customTemplatesPath: customTemplates && computeCustomTemplatesPath(config.configPath, customTemplates),
	}

	const aCommonGenerator = commonGenerator(config, context)

	return {
		...context.baseGenerator(config, context),
		...aCommonGenerator,
		...javaLikeGenerator(config, javaLikeContext),
		generatorType: () => CodegenGeneratorType.DOCUMENTATION,
		toIdentifier: (name) => name,
		toLiteral: (value, options) => {
			if (value === undefined) {
				const defaultValue = context.generator().defaultValue(options)
				if (defaultValue === null) {
					return null
				}
				return defaultValue.literalValue
			}

			return `${value}`
		},
		toNativeType: (options) => {
			const { type, format } = options
			if (type === 'string') {
				if (format) {
					return new context.NativeType(format, {
						serializedType: 'string',
					})
				}
			} else if (type === 'integer') {
				if (format) {
					return new context.NativeType(format, {
						serializedType: 'number',
					})
				}
			}

			return new context.NativeType(type, {
				serializedType: '', /* To prevent us from outputting in the documentation */
			})
		},
		toNativeObjectType: function(options) {
			const { scopedName } = options
			let modelName = ''
			for (const name of scopedName) {
				modelName += `.${context.generator().toClassName(name)}`
			}
			return new context.NativeType(modelName.substring(1))
		},
		toNativeArrayType: (options) => {
			const { componentNativeType } = options
			return new context.NativeType(`${toSafeTypeForComposing(componentNativeType.nativeType)}[]`)
		},
		toNativeMapType: (options) => {
			const { keyNativeType, componentNativeType } = options
			return new context.NativeType(`{ [name: ${keyNativeType}]: ${componentNativeType} }`)
		},
		nativeTypeUsageTransformer: ({ nullable }) => ({
			default: function(nativeType, nativeTypeString) {
				if (nullable) {
					return `${toSafeTypeForComposing(nativeTypeString)} | null`
				}
				return nativeTypeString
			},
			/* We don't transform the concrete type as the concrete type is never null; we use it to make new objects */
			concreteType: null,
		}),
		defaultValue: () => {
			return { value: null, literalValue: 'undefined' }
		},
		initialValue: () => {
			return { value: null, literalValue: 'undefined' }
		},
		toOperationGroupName: (name) => {
			return name
		},
		operationGroupingStrategy: () => {
			return context.operationGroupingStrategies.addToGroupsByTagOrPath
		},
		allOfStrategy: () => CodegenAllOfStrategy.NATIVE,
		anyOfStrategy: () => CodegenAnyOfStrategy.NATIVE,
		oneOfStrategy: () => CodegenOneOfStrategy.NATIVE,
		supportsInheritance: () => false,
		supportsMultipleInheritance: () => false,
		nativeCompositionCanBeScope: () => true,
		nativeComposedSchemaRequiresName: () => false,
		nativeComposedSchemaRequiresObjectLikeOrWrapper: () => false,

		watchPaths: () => {
			const result = [path.resolve(__dirname, '..', 'templates')]
			result.push(path.resolve(__dirname, '..', 'less'))
			result.push(path.resolve(__dirname, '..', 'static'))
			if (generatorOptions.customTemplatesPath) {
				result.push(generatorOptions.customTemplatesPath)
			}
			return result
		},

		cleanPathPatterns: () => undefined,

		templateRootContext: () => {
			return {
				...aCommonGenerator.templateRootContext(),
				...generatorOptions,
				generatorClass: '@openapi-generator-plus/plain-documentation-generator',
			}
		},

		exportTemplates: async(outputPath, doc) => {
			const hbs = Handlebars.create()

			registerStandardHelpers(hbs, context)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			hbs.registerHelper('eachSorted', function(this: unknown, context: unknown, options: Handlebars.HelperOptions) {
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

			if (generatorOptions.customTemplatesPath) {
				await loadTemplates(generatorOptions.customTemplatesPath, hbs)
			}

			const rootContext = context.generator().templateRootContext()

			if (!outputPath.endsWith('/')) {
				outputPath += '/'
			}

			await emit('index', path.join(outputPath, 'index.html'), { ...rootContext, ...doc }, true, hbs)

			emitLess('style.less', path.join(outputPath, 'main.css'))
			copyContents(path.resolve(__dirname, '..', 'static'), outputPath)
		},
	}
}

export default createGenerator
