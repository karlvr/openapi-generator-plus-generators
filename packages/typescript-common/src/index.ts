import { CodegenRootContext, CodegenPropertyType, CodegenModelReference, CodegenNativeType, CodegenGeneratorContext, CodegenGenerator, CodegenConfig, CodegenState, CodegenDocument } from '@openapi-generator-plus/types'
import { CodegenOptionsTypeScript, NpmOptions, TypeScriptOptions } from './types'
import path from 'path'
import Handlebars from 'handlebars'
import { loadTemplates, emit, registerStandardHelpers } from '@openapi-generator-plus/handlebars-templates'
import { javaLikeGenerator } from '@openapi-generator-plus/java-like-generator-helper'
import { commonGenerator, pascalCase } from '@openapi-generator-plus/generator-common'

export { CodegenOptionsTypeScript, NpmOptions, TypeScriptOptions } from './types'

function escapeString(value: string) {
	value = value.replace(/\\/g, '\\\\')
	value = value.replace(/'/g, '\\\'')
	value = value.replace(/\n/g, '\\n')
	return value
}

function computeCustomTemplatesPath(configPath: string | undefined, customTemplatesPath: string) {
	if (configPath) {
		return path.resolve(path.dirname(configPath), customTemplatesPath) 
	} else {
		return customTemplatesPath
	}
}

function toSafeTypeForComposing(nativeType: string): string {
	if (/[^a-zA-Z0-9_.]/.test(nativeType)) {
		return `(${nativeType})`
	} else {
		return nativeType
	}
}

export interface TypeScriptGeneratorContext<O extends CodegenOptionsTypeScript> extends CodegenGeneratorContext {
	loadAdditionalTemplates?: (hbs: typeof Handlebars) => Promise<void>
	customiseRootContext?: (rootContext: CodegenRootContext) => Promise<void>
	additionalWatchPaths?: (config: CodegenConfig) => string[]
	additionalExportTemplates?: (outputPath: string, doc: CodegenDocument, hbs: typeof Handlebars, rootContext: CodegenRootContext, state: CodegenState<O>) => Promise<void>
	transformOptions?: (config: CodegenConfig, options: CodegenOptionsTypeScript) => O
	defaultNpmOptions?: (config: CodegenConfig) => NpmOptions
	defaultTypeScriptOptions?: (config: CodegenConfig) => TypeScriptOptions
	generatorClassName: (state: CodegenState<O>) => string
}

/* https://github.com/microsoft/TypeScript/issues/2536 */
const RESERVED_WORDS = [
	'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do',
	'else', 'enum', 'export', 'extends', 'false', 'finally', 'for', 'function', 'if', 'import',
	'in', 'instanceof', 'new', 'null', 'return', 'super', 'switch', 'this', 'throw', 'true',
	'try', 'typeof', 'var', 'void', 'while', 'with',
	'as', 'implements', 'interface', 'let', 'package', 'private', 'protected', 'public', 'static', 'yield',
	'any', 'boolean', 'constructor', 'declare', 'get', 'module', 'require', 'number', 'set', 'string', 'symbol', 'type', 'from', 'of',
]

export default function createGenerator<O extends CodegenOptionsTypeScript>(context: TypeScriptGeneratorContext<O>): Omit<CodegenGenerator<O>, 'generatorType'> {
	return {
		...context.baseGenerator(),
		...commonGenerator(),
		...javaLikeGenerator({
			reservedWords: () => RESERVED_WORDS,
		}),
		toConstantName: (name) => {
			return pascalCase(name)
		},
		toLiteral: (value, options, state) => {
			if (value === undefined) {
				return state.generator.toDefaultValue(undefined, options, state).literalValue
			}

			const { type, format, required, propertyType } = options

			if (propertyType === CodegenPropertyType.ENUM) {
				return `${options.nativeType.toString()}.${state.generator.toEnumMemberName(value, state)}`
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
		toNativeType: ({ type, format }) => {
			/* See https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#data-types */
			switch (type) {
				case 'integer': {
					return new context.NativeType('number')
				}
				case 'number': {
					return new context.NativeType('number')
				}
				case 'string': {
					switch (format) {
						case 'date':
						case 'time':
						case 'date-time':
							/* We don't have a mapping library to convert incoming and outgoing JSON, so the rawType of dates is string */
							return new context.NativeType('Date', {
								wireType: 'string',
							})
						default:
							return new context.NativeType('string')
					}
				}
				case 'boolean': {
					return new context.NativeType('boolean')
				}
				case 'file': {
					/* JavaScript does have a File type, but it isn't supported by JSON serialization so we don't have a wireType */
					return new context.NativeType('File', {
						wireType: null,
					})
				}
			}

			throw new Error(`Unsupported type name: ${type}`)
		},
		toNativeObjectType: function({ modelNames }, state) {
			let modelName = 'Api'
			for (const name of modelNames) {
				modelName += `.${state.generator.toClassName(name, state)}`
			}
			return new context.NativeType(modelName)
		},
		toNativeArrayType: ({ componentNativeType }) => {
			return new context.TransformingNativeType(componentNativeType, (nativeTypeString) => {
				return `${toSafeTypeForComposing(nativeTypeString)}[]`
			})
		},
		toNativeMapType: ({ keyNativeType, componentNativeType }) => {
			return new context.ComposingNativeType([keyNativeType, componentNativeType], (nativeTypeStrings) => {
				return `{ [name: ${nativeTypeStrings[0]}]: ${nativeTypeStrings[1]} }`
			})
		},
		toDefaultValue: (defaultValue, options, state) => {
			if (defaultValue !== undefined) {
				return {
					value: defaultValue,
					literalValue: state.generator.toLiteral(defaultValue, options, state),
				}
			}

			const { propertyType, required } = options

			if (!required) {
				return { literalValue: 'undefined' }
			}

			switch (propertyType) {
				case CodegenPropertyType.NUMBER:
					return { value: 0, literalValue: state.generator.toLiteral(0, options, state) }
				case CodegenPropertyType.BOOLEAN:
					return { value: false, literalValue: 'false' }
				case CodegenPropertyType.ARRAY:
					return { value: [], literalValue: '[]' }
				case CodegenPropertyType.MAP:
					return { value: {}, literalValue: '{}' }
				default:
					return { literalValue: 'undefined' }
			}
		},
		options: (config): O => {
			const npm = config.npm
			const defaultRelativeSourceOutputPath = npm ? 'src' : ''
			
			const relativeSourceOutputPath: string = config.relativeSourceOutputPath !== undefined ? config.relativeSourceOutputPath : defaultRelativeSourceOutputPath

			const defaultNpmOptions: NpmOptions = context.defaultNpmOptions ? context.defaultNpmOptions(config) : {
				name: 'typescript-gen',
				version: '0.0.1',
			}
			const npmConfig: NpmOptions | undefined = npm ? {
				name: npm.name || defaultNpmOptions.name,
				version: npm.version || defaultNpmOptions.version,
				repository: npm.repository || defaultNpmOptions.repository,
				private: npm.private || defaultNpmOptions.private,
			} : undefined

			const defaultTypeScriptOptions: TypeScriptOptions = context.defaultTypeScriptOptions ? context.defaultTypeScriptOptions(config) : typeof config.typescript === 'object' ? {
				target: 'ES5',
				libs: ['$target', 'DOM'],
			} : {
				target: 'ES5',
				libs: ['$target', 'DOM'],
			}

			let typeScriptOptions: TypeScriptOptions | undefined
			if (typeof config.typescript === 'object') {
				typeScriptOptions = defaultTypeScriptOptions
				if (typeof config.typescript.target === 'string') {
					typeScriptOptions.target = config.typescript.target
				}
			} else if (typeof config.typescript === 'boolean' && config.typescript) {
				typeScriptOptions = defaultTypeScriptOptions
			} else {
				typeScriptOptions = undefined
			}

			if (typeScriptOptions) {
				typeScriptOptions.libs = typeScriptOptions.libs.map(lib => lib === '$target' ? typeScriptOptions!.target : lib)
			}

			const typescriptOptions: TypeScriptOptions | undefined = typeof config.typescript === 'object' ? {
				target: config.typescript.target || defaultTypeScriptOptions.target,
				libs: config.typescript.libs || defaultTypeScriptOptions.libs,
			} : (typeof config.typescript === 'boolean' && !config.typescript) ? undefined : {
				target: defaultTypeScriptOptions.target,
				libs: defaultTypeScriptOptions.libs,
			}

			const options: CodegenOptionsTypeScript = {
				relativeSourceOutputPath,
				npm: npmConfig,
				typescript: typescriptOptions,
				customTemplatesPath: config.customTemplates && computeCustomTemplatesPath(config.configPath, config.customTemplates),
			}

			if (context.transformOptions) {
				return context.transformOptions(config, options)
			} else {
				/* We must assume that our options are sufficient for the requirements of O as a transformOptions function was not provided */
				return options as O
			}
		},
		operationGroupingStrategy: () => {
			return context.operationGroupingStrategies.addToGroupsByTagOrPath
		},

		postProcessModel: (model) => {
			function toDisjunction(references: CodegenModelReference[], transform: (nativeType: CodegenNativeType) => string | undefined): string | undefined {
				const result = references.reduce((result, reference) => {
					const r = transform(reference.model.propertyNativeType)
					if (!r) {
						return result
					}
					if (result) {
						return `${result} | ${toSafeTypeForComposing(r)}`
					} else {
						return toSafeTypeForComposing(r)
					}
				}, '')
				if (result) {
					return result
				} else {
					return undefined
				}
			}

			/* If this model has a discriminator then we change its propertyNativeType to a disjunction */
			if (model.discriminator) {
				if (model.discriminator.references) {
					model.propertyNativeType.nativeType = toDisjunction(model.discriminator.references, (nativeType) => nativeType.nativeType)!
					model.propertyNativeType.wireType = toDisjunction(model.discriminator.references, (nativeType) => nativeType.wireType)
					model.propertyNativeType.literalType = toDisjunction(model.discriminator.references, (nativeType) => nativeType.literalType)
					model.propertyNativeType.concreteType = toDisjunction(model.discriminator.references, (nativeType) => nativeType.concreteType)
					
					if (model.propertyNativeType.componentType && model.propertyNativeType.componentType !== model.propertyNativeType) {
						model.propertyNativeType.componentType.nativeType = toDisjunction(model.discriminator.references, (nativeType) => nativeType.componentType ? nativeType.componentType.nativeType : nativeType.nativeType)!
						model.propertyNativeType.componentType.wireType = toDisjunction(model.discriminator.references, (nativeType) => nativeType.componentType ? nativeType.componentType.wireType : nativeType.wireType)
						model.propertyNativeType.componentType.literalType = toDisjunction(model.discriminator.references, (nativeType) => nativeType.componentType ? nativeType.componentType.literalType : nativeType.literalType)
						model.propertyNativeType.componentType.concreteType = toDisjunction(model.discriminator.references, (nativeType) => nativeType.componentType ? nativeType.componentType.concreteType : nativeType.concreteType)
					}
				}
			}
		},

		watchPaths: (config) => {
			const result = [path.resolve(__dirname, '..', 'templates')]
			if (context.additionalWatchPaths) {
				result.push(...context.additionalWatchPaths(config))
			}
			if (config.customTemplates) {
				result.push(computeCustomTemplatesPath(config.configPath, config.customTemplates))
			}
			return result
		},

		cleanPathPatterns: () => undefined,

		exportTemplates: async(outputPath, doc, state) => {
			const hbs = Handlebars.create()

			registerStandardHelpers(hbs, context, state)

			await loadTemplates(path.resolve(__dirname, '..', 'templates'), hbs)
			if (context.loadAdditionalTemplates) {
				await context.loadAdditionalTemplates(hbs)
			}

			if (state.options.customTemplatesPath) {
				await loadTemplates(state.options.customTemplatesPath, hbs)
			}

			const rootContext: CodegenRootContext = {
				generatorClass: context.generatorClassName(state),
				generatedDate: new Date().toISOString(),
			}
			if (context.customiseRootContext) {
				await context.customiseRootContext(rootContext)
			}

			if (state.options.npm) {
				await emit('package', path.join(outputPath, 'package.json'), { ...state.options.npm, ...state.options, ...rootContext }, true, hbs)
			}
			
			if (state.options.typescript) {
				await emit('tsconfig', path.join(outputPath, 'tsconfig.json'), { ...state.options.typescript, ...state.options, ...rootContext }, true, hbs)
			}
			await emit('gitignore', path.join(outputPath, '.gitignore'), { ...doc, ...state.options, ...rootContext }, true, hbs)
	
			if (context.additionalExportTemplates) {
				await context.additionalExportTemplates(outputPath, doc, hbs, rootContext, state)
			}
		},
	}
}
