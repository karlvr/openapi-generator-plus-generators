import { CodegenRootContext, CodegenGeneratorConstructor, CodegenPropertyType, CodegenModelReference, CodegenNativeType, CodegenGeneratorType } from '@openapi-generator-plus/types'
import { CodegenOptionsTypescript, NpmOptions, TypeScriptOptions } from './types'
import path from 'path'
import Handlebars from 'handlebars'
import { loadTemplates, emit, registerStandardHelpers } from '@openapi-generator-plus/handlebars-templates'
import { javaLikeGenerator } from '@openapi-generator-plus/java-like-generator-helper'
import { commonGenerator, pascalCase, GroupingStrategies } from '@openapi-generator-plus/generator-common'

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

export const createGenerator: CodegenGeneratorConstructor<CodegenOptionsTypescript> = (context) => ({
	...context.baseGenerator(),
	...commonGenerator(),
	...javaLikeGenerator(),
	generatorType: () => CodegenGeneratorType.CLIENT,
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
	options: (config): CodegenOptionsTypescript => {
		const npm = config.npm
		const defaultRelativeSourceOutputPath = npm ? 'src' : ''
		
		const relativeSourceOutputPath: string = config.relativeSourceOutputPath !== undefined ? config.relativeSourceOutputPath : defaultRelativeSourceOutputPath

		const npmConfig: NpmOptions | undefined = npm ? {
			name: npm.name || 'typescript-fetch-api',
			version: npm.version || '0.0.1',
			repository: npm.repository,
			private: npm.private,
		} : undefined

		const typescriptOptions: TypeScriptOptions | undefined = typeof config.typescript === 'object' ? {
			target: config.typescript.target || 'ES5',
			libs: config.typescript.libs || [config.typescript.target || 'ES5', 'DOM'],
		} : (typeof config.typescript === 'boolean' && !config.typescript) ? undefined : {
			target: 'ES5',
			libs: ['ES5', 'DOM'],
		}

		return {
			relativeSourceOutputPath,
			npm: npmConfig,
			typescript: typescriptOptions,
			customTemplatesPath: config.customTemplates && computeCustomTemplatesPath(config.configPath, config.customTemplates),
		}
	},
	operationGroupingStrategy: () => {
		return GroupingStrategies.addToGroupsByTagOrPath
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

		if (state.options.customTemplatesPath) {
			await loadTemplates(state.options.customTemplatesPath, hbs)
		}

		const rootContext: CodegenRootContext = {
			generatorClass: '@openapi-generator-plus/typescript-fetch-client-generator',
			generatedDate: new Date().toISOString(),
		}

		const relativeSourceOutputPath = state.options.relativeSourceOutputPath

		await emit('api', path.join(outputPath, relativeSourceOutputPath, 'api.ts'), { ...doc, ...state.options, ...rootContext }, true, hbs)
		await emit('models', path.join(outputPath, relativeSourceOutputPath, 'models.ts'), { ...doc, ...state.options, ...rootContext }, true, hbs)
		await emit('runtime', path.join(outputPath, relativeSourceOutputPath, 'runtime.ts'), { ...doc, ...state.options, ...rootContext }, true, hbs)
		await emit('configuration', path.join(outputPath, relativeSourceOutputPath, 'configuration.ts'), { ...doc, ...state.options, ...rootContext }, true, hbs)
		await emit('custom.d', path.join(outputPath, relativeSourceOutputPath, 'custom.d.ts'), { ...doc, ...state.options, ...rootContext }, true, hbs)
		await emit('index', path.join(outputPath, relativeSourceOutputPath, 'index.ts'), { ...doc, ...state.options, ...rootContext }, true, hbs)
		if (state.options.npm) {
			await emit('package', path.join(outputPath, 'package.json'), { ...state.options.npm, ...state.options, ...rootContext }, true, hbs)
		}
		await emit('README', path.join(outputPath, 'README.md'), { ...doc, ...state.options, ...rootContext }, true, hbs)
		if (state.options.typescript) {
			await emit('tsconfig', path.join(outputPath, 'tsconfig.json'), { ...state.options.typescript, ...state.options, ...rootContext }, true, hbs)
		}
		await emit('gitignore', path.join(outputPath, '.gitignore'), { ...doc, ...state.options, ...rootContext }, true, hbs)
	},
})

export default createGenerator
