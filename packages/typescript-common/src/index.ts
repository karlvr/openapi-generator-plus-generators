import { CodegenSchemaType, CodegenModelReference, CodegenNativeType, CodegenGeneratorContext, CodegenGenerator, CodegenConfig, CodegenDocument, CodegenModel } from '@openapi-generator-plus/types'
import { CodegenOptionsTypeScript, NpmOptions, TypeScriptOptions } from './types'
import path from 'path'
import Handlebars from 'handlebars'
import { loadTemplates, emit, registerStandardHelpers } from '@openapi-generator-plus/handlebars-templates'
import { javaLikeGenerator, ConstantStyle, JavaLikeContext, options as javaLikeOptions } from '@openapi-generator-plus/java-like-generator-helper'
import { commonGenerator } from '@openapi-generator-plus/generator-common'
import * as idx from '@openapi-generator-plus/indexed-type'

export { CodegenOptionsTypeScript, NpmOptions, TypeScriptOptions } from './types'

function escapeString(value: string) {
	if (typeof value !== 'string') {
		throw new Error(`escapeString called with non-string: ${typeof value} (${value})`)
	}
	
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

export interface TypeScriptGeneratorContext extends CodegenGeneratorContext {
	loadAdditionalTemplates?: (hbs: typeof Handlebars) => Promise<void>
	additionalWatchPaths?: () => string[]
	additionalExportTemplates?: (outputPath: string, doc: CodegenDocument, hbs: typeof Handlebars, rootContext: Record<string, unknown>) => Promise<void>
	defaultNpmOptions?: (config: CodegenConfig) => NpmOptions
	defaultTypeScriptOptions?: (config: CodegenConfig) => TypeScriptOptions
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

export function options(config: CodegenConfig, context: TypeScriptGeneratorContext): CodegenOptionsTypeScript {
	const npm = config.npm
	const defaultRelativeSourceOutputPath = npm ? 'src' : ''
	
	const relativeSourceOutputPath: string = config.relativeSourceOutputPath !== undefined ? config.relativeSourceOutputPath : defaultRelativeSourceOutputPath

	const defaultNpmOptions: NpmOptions = context.defaultNpmOptions ? context.defaultNpmOptions(config) : {
		name: 'typescript-gen',
		version: '0.0.1',
		private: true,
		repository: null,
	}
	const npmConfig: NpmOptions | undefined = npm ? {
		name: npm.name || defaultNpmOptions.name,
		version: npm.version || defaultNpmOptions.version,
		repository: npm.repository || defaultNpmOptions.repository,
		private: npm.private !== undefined ? npm.private : defaultNpmOptions.private,
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
		if (config.typescript.libs) {
			typeScriptOptions.libs = config.typescript.libs
		}
	} else if (typeof config.typescript === 'boolean') {
		if (config.typescript) {
			typeScriptOptions = defaultTypeScriptOptions
		} else {
			typeScriptOptions = undefined
		}
	} else if (!npm) {
		/* If we haven't configured an npm package, then assume we don't want tsconfig either */
		typeScriptOptions = undefined
	} else {
		typeScriptOptions = defaultTypeScriptOptions
	}

	if (typeScriptOptions) {
		typeScriptOptions.libs = typeScriptOptions.libs.map(lib => lib === '$target' ? typeScriptOptions!.target : lib)
	}

	const options: CodegenOptionsTypeScript = {
		...javaLikeOptions(config, createJavaLikeContext(context)),
		relativeSourceOutputPath,
		npm: npmConfig || null,
		typescript: typeScriptOptions || null,
		customTemplatesPath: config.customTemplates && computeCustomTemplatesPath(config.configPath, config.customTemplates),
	}

	return options
}

function createJavaLikeContext(context: TypeScriptGeneratorContext): JavaLikeContext {
	const javaLikeContext: JavaLikeContext = {
		...context,
		reservedWords: () => RESERVED_WORDS,
		defaultConstantStyle: ConstantStyle.pascalCase,
	}
	return javaLikeContext
}

export default function createGenerator(config: CodegenConfig, context: TypeScriptGeneratorContext): Omit<CodegenGenerator, 'generatorType'> {
	const generatorOptions = options(config, context)

	const aCommonGenerator = commonGenerator(config, context)
	return {
		...context.baseGenerator(config, context),
		...aCommonGenerator,
		...javaLikeGenerator(config, createJavaLikeContext(context)),
		toLiteral: (value, options) => {
			if (value === undefined) {
				return context.generator().toDefaultValue(undefined, options).literalValue
			}

			const { type, format, schemaType } = options

			if (schemaType === CodegenSchemaType.ENUM) {
				return `${options.nativeType.toString()}.${context.generator().toEnumMemberName(value)}`
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
					return `${value}`
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
								serializedType: 'string',
							})
						default:
							return new context.NativeType('string')
					}
				}
				case 'boolean': {
					return new context.NativeType('boolean')
				}
				case 'file': {
					/* JavaScript does have a File type, but it isn't supported by JSON serialization so we don't have a serializedType */
					return new context.NativeType('File', {
						serializedType: null,
					})
				}
			}

			throw new Error(`Unsupported type name: ${type}`)
		},
		toNativeObjectType: function({ modelNames }) {
			let modelName = 'Api'
			for (const name of modelNames) {
				modelName += `.${context.generator().toClassName(name)}`
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
		toDefaultValue: (defaultValue, options) => {
			if (defaultValue !== undefined) {
				return {
					value: defaultValue,
					literalValue: context.generator().toLiteral(defaultValue, options),
				}
			}

			const { schemaType, required } = options

			if (!required) {
				return { value: null, literalValue: 'undefined' }
			}

			switch (schemaType) {
				case CodegenSchemaType.NUMBER:
					return { value: 0, literalValue: context.generator().toLiteral(0, options) }
				case CodegenSchemaType.BOOLEAN:
					return { value: false, literalValue: 'false' }
				case CodegenSchemaType.ARRAY:
					return { value: [], literalValue: '[]' }
				case CodegenSchemaType.MAP:
					return { value: {}, literalValue: '{}' }
				default:
					return { value: null, literalValue: 'undefined' }
			}
		},
		operationGroupingStrategy: () => {
			return context.operationGroupingStrategies.addToGroupsByTagOrPath
		},

		postProcessModel: (model) => {
			function modelReferencesToDisjunction(references: CodegenModelReference[], transform: (nativeType: CodegenNativeType) => string | undefined): string | undefined {
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

			function modelsToDisjunction(models: CodegenModel[], transform: (nativeType: CodegenNativeType) => string | undefined): string | undefined {
				const result = models.reduce((result, model) => {
					const r = transform(model.propertyNativeType)
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

			if (model.discriminator) {
				/* If this model has a discriminator then we change its propertyNativeType to a disjunction */
				if (model.discriminator.references) {
					const newNativeType = modelReferencesToDisjunction(model.discriminator.references, (nativeType) => nativeType.nativeType)
					if (newNativeType) {
						if (!tryToConvertModelToLiteralType(model, newNativeType)) {
							model.propertyNativeType.nativeType = newNativeType
							model.propertyNativeType.serializedType = modelReferencesToDisjunction(model.discriminator.references, (nativeType) => nativeType.serializedType)
							model.propertyNativeType.literalType = modelReferencesToDisjunction(model.discriminator.references, (nativeType) => nativeType.literalType)
							model.propertyNativeType.concreteType = modelReferencesToDisjunction(model.discriminator.references, (nativeType) => nativeType.concreteType)
							
							if (model.propertyNativeType.componentType && model.propertyNativeType.componentType !== model.propertyNativeType) {
								model.propertyNativeType.componentType.nativeType = modelReferencesToDisjunction(model.discriminator.references, (nativeType) => nativeType.componentType ? nativeType.componentType.nativeType : nativeType.nativeType)!
								model.propertyNativeType.componentType.serializedType = modelReferencesToDisjunction(model.discriminator.references, (nativeType) => nativeType.componentType ? nativeType.componentType.serializedType : nativeType.serializedType)
								model.propertyNativeType.componentType.literalType = modelReferencesToDisjunction(model.discriminator.references, (nativeType) => nativeType.componentType ? nativeType.componentType.literalType : nativeType.literalType)
								model.propertyNativeType.componentType.concreteType = modelReferencesToDisjunction(model.discriminator.references, (nativeType) => nativeType.componentType ? nativeType.componentType.concreteType : nativeType.concreteType)
							}
						}
					}
				}
			} else if (model.implementors && !model.properties && !model.parent) {
				/* If this model is a parent interface for others, but has no properties of its own, then we can convert it to a disjunction */
				const implementors = idx.allValues(model.implementors)

				const newNativeType = modelsToDisjunction(implementors, (nativeType) => nativeType.nativeType)
				if (newNativeType) {
					if (!tryToConvertModelToLiteralType(model, newNativeType)) {
						model.propertyNativeType.nativeType = newNativeType
						model.propertyNativeType.serializedType = modelsToDisjunction(implementors, (nativeType) => nativeType.serializedType)
						model.propertyNativeType.literalType = modelsToDisjunction(implementors, (nativeType) => nativeType.literalType)
						model.propertyNativeType.concreteType = modelsToDisjunction(implementors, (nativeType) => nativeType.concreteType)
						
						if (model.propertyNativeType.componentType && model.propertyNativeType.componentType !== model.propertyNativeType) {
							model.propertyNativeType.componentType.nativeType = modelsToDisjunction(implementors, (nativeType) => nativeType.componentType ? nativeType.componentType.nativeType : nativeType.nativeType)!
							model.propertyNativeType.componentType.serializedType = modelsToDisjunction(implementors, (nativeType) => nativeType.componentType ? nativeType.componentType.serializedType : nativeType.serializedType)
							model.propertyNativeType.componentType.literalType = modelsToDisjunction(implementors, (nativeType) => nativeType.componentType ? nativeType.componentType.literalType : nativeType.literalType)
							model.propertyNativeType.componentType.concreteType = modelsToDisjunction(implementors, (nativeType) => nativeType.componentType ? nativeType.componentType.concreteType : nativeType.concreteType)
						}
					}
				}
			}
		},

		watchPaths: () => {
			const result = [path.resolve(__dirname, '..', 'templates')]
			if (context.additionalWatchPaths) {
				result.push(...context.additionalWatchPaths())
			}
			if (config.customTemplates) {
				result.push(computeCustomTemplatesPath(config.configPath, config.customTemplates))
			}
			return result
		},

		cleanPathPatterns: () => undefined,

		templateRootContext: () => {
			return {
				...aCommonGenerator.templateRootContext(),
				...generatorOptions,
			}
		},

		exportTemplates: async(outputPath, doc) => {
			const hbs = Handlebars.create()

			registerStandardHelpers(hbs, context)

			await loadTemplates(path.resolve(__dirname, '..', 'templates'), hbs)
			if (context.loadAdditionalTemplates) {
				await context.loadAdditionalTemplates(hbs)
			}

			if (generatorOptions.customTemplatesPath) {
				await loadTemplates(generatorOptions.customTemplatesPath, hbs)
			}

			const rootContext = context.generator().templateRootContext()

			if (generatorOptions.npm) {
				await emit('package', path.join(outputPath, 'package.json'), { ...rootContext, ...generatorOptions.npm }, true, hbs)
				await emit('gitignore', path.join(outputPath, '.gitignore'), { ...rootContext, ...doc }, true, hbs)
			}
			
			if (generatorOptions.typescript) {
				await emit('tsconfig', path.join(outputPath, 'tsconfig.json'), { ...rootContext, ...generatorOptions.typescript }, true, hbs)
			}
	
			if (context.additionalExportTemplates) {
				await context.additionalExportTemplates(outputPath, doc, hbs, rootContext)
			}
		},
	}
}

/**
 * If a model ends up being just a placeholder, such as just representing a type disjunction, in TypeScript
 * we can declare it as a literal type rather than an interface.
 * e.g. `type X = A | B | C` rather than `interface X {}`
 * @param model 
 * @param literalType
 */
function tryToConvertModelToLiteralType(model: CodegenModel, literalType: string) {
	if (!model.properties && !model.implements && !model.parent) {
		if (!model.vendorExtensions) {
			model.vendorExtensions = idx.create()
		}
		idx.set(model.vendorExtensions, 'convert-to-literal-type', literalType)

		if (model.implementors) {
			for (const other of idx.values(model.implementors)) {
				if (other.implements) {
					idx.remove(other.implements, model.name)
					if (idx.isEmpty(other.implements)) {
						other.implements = null
					}
				}
			}
		}
		if (model.children) {
			for (const other of idx.values(model.children)) {
				if (other.parent == model) {
					other.parent = null
					other.parentNativeType = null
				}
			}
		}

		return true
	} else {
		return false
	}
}

