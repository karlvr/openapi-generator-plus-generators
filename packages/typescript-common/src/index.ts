import { CodegenSchemaType, CodegenObjectSchemaReference, CodegenNativeType, CodegenGeneratorContext, CodegenGenerator, CodegenConfig, CodegenDocument, CodegenObjectSchema, isCodegenObjectSchema, CodegenSchema } from '@openapi-generator-plus/types'
import { CodegenOptionsTypeScript, DateApproach, NpmOptions, TypeScriptOptions } from './types'
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
	defaultNpmOptions?: (config: CodegenConfig, defaultValue: NpmOptions) => NpmOptions
	defaultTypeScriptOptions?: (config: CodegenConfig, defaultValue: TypeScriptOptions) => TypeScriptOptions
}

export function chainTypeScriptGeneratorContext(base: TypeScriptGeneratorContext, add: Partial<TypeScriptGeneratorContext>): TypeScriptGeneratorContext {
	const result: TypeScriptGeneratorContext = {
		...base,
		loadAdditionalTemplates: async function(hbs) {
			/* Load the additional first, so that earlier contexts in the chain have priority */
			if (add.loadAdditionalTemplates) {
				await add.loadAdditionalTemplates(hbs)
			}
			if (base.loadAdditionalTemplates) {
				await base.loadAdditionalTemplates(hbs)
			}
		},
		additionalWatchPaths: function() {
			const result: string[] = []
			if (base.additionalWatchPaths) {
				result.push(...base.additionalWatchPaths())
			}
			if (add.additionalWatchPaths) {
				result.push(...add.additionalWatchPaths())
			}
			return result
		},
		additionalExportTemplates: async function(outputPath, doc, hbs, rootContext) {
			if (base.additionalExportTemplates) {
				await base.additionalExportTemplates(outputPath, doc, hbs, rootContext)
			}
			if (add.additionalExportTemplates) {
				await add.additionalExportTemplates(outputPath, doc, hbs, rootContext)
			}
		},
		defaultNpmOptions: function(config, defaultOptions) {
			let result: NpmOptions = defaultOptions
			if (add.defaultNpmOptions) {
				result = add.defaultNpmOptions(config, result)
			}
			if (base.defaultNpmOptions) {
				result = base.defaultNpmOptions(config, result)
			}
			return result
		},
		defaultTypeScriptOptions: function(config, defaultOptions) {
			let result: TypeScriptOptions = defaultOptions
			if (add.defaultTypeScriptOptions) {
				result = add.defaultTypeScriptOptions(config, result)
			}
			if (base.defaultTypeScriptOptions) {
				result = base.defaultTypeScriptOptions(config, result)
			}
			return result
		},
	}
	return result
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

	const defaultDefaultNpmOptions: NpmOptions = {
		name: 'typescript-gen',
		version: '0.0.1',
		private: true,
		repository: null,
	}
	const defaultNpmOptions: NpmOptions = context.defaultNpmOptions ? context.defaultNpmOptions(config, defaultDefaultNpmOptions) : defaultDefaultNpmOptions
	const npmConfig: NpmOptions | undefined = npm ? {
		name: npm.name || defaultNpmOptions.name,
		version: npm.version || defaultNpmOptions.version,
		repository: npm.repository || defaultNpmOptions.repository,
		private: npm.private !== undefined ? npm.private : defaultNpmOptions.private,
	} : undefined

	const defaultDefaultTypeScriptOptions: TypeScriptOptions = typeof config.typescript === 'object' ? {
		target: 'ES5',
		libs: ['$target', 'DOM'],
	} : {
		target: 'ES5',
		libs: ['$target', 'DOM'],
	}
	const defaultTypeScriptOptions: TypeScriptOptions = context.defaultTypeScriptOptions ? context.defaultTypeScriptOptions(config, defaultDefaultTypeScriptOptions) : defaultDefaultTypeScriptOptions

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

	const dateApproach = parseDateApproach(config.dateApproach)

	const options: CodegenOptionsTypeScript = {
		...javaLikeOptions(config, createJavaLikeContext(context)),
		relativeSourceOutputPath,
		npm: npmConfig || null,
		typescript: typeScriptOptions || null,
		customTemplatesPath: config.customTemplates && computeCustomTemplatesPath(config.configPath, config.customTemplates),
		dateApproach,
	}

	return options
}

function parseDateApproach(approach: string) {
	if (!approach) {
		return DateApproach.Native
	} else if (approach === DateApproach.BlindDate) {
		return DateApproach.BlindDate
	} else if (approach === DateApproach.Native) {
		return DateApproach.Native
	} else if (approach === DateApproach.String) {
		return DateApproach.String
	} else {
		throw new Error(`Invalid dateApproach config: ${approach}`)
	}
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
				return context.generator().defaultValue(options).literalValue
			}
			if (value === null) {
				return 'null'
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
						switch (generatorOptions.dateApproach) {
							case DateApproach.Native:
							case DateApproach.String:
								/* Use a string as a JavaScript Date cannot represent a date properly */
								return `"${value}"`
							case DateApproach.BlindDate:
								return `toLocalDateString("${value}")`
						}
						throw new Error(`Unsupported date approach: ${generatorOptions.dateApproach}`)
					} else if (format === 'time') {
						switch (generatorOptions.dateApproach) {
							case DateApproach.Native:
							case DateApproach.String:
								/* Use a string as a JavaScript Date cannot represent a time properly */
								return `"${value}"`
							case DateApproach.BlindDate:
								return `toLocalTimeString("${value}")`
						}
						throw new Error(`Unsupported date approach: ${generatorOptions.dateApproach}`)
					} else if (format === 'date-time') {
						switch (generatorOptions.dateApproach) {
							case DateApproach.Native:
								/* The date-time format should be an ISO datetime with an offset timezone */
								return `new Date("${value}")`
							case DateApproach.BlindDate:
								return `toOffsetDateTimeString("${value}")`
							case DateApproach.String:
								return `"${value}"`
						}
						throw new Error(`Unsupported date approach: ${generatorOptions.dateApproach}`)
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
		toNativeType: ({ type, format, nullable }) => {
			/* See https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#data-types */
			switch (type) {
				case 'integer': {
					return new context.NativeType(nullable ? 'number | null' : 'number')
				}
				case 'number': {
					return new context.NativeType(nullable ? 'number | null' : 'number')
				}
				case 'string': {
					switch (format) {
						case 'date':
							switch (generatorOptions.dateApproach) {
								case DateApproach.Native:
								case DateApproach.String:
									/* We use strings for date and time as JavaScript Date can't support */
									return new context.NativeType(nullable ? 'string | null' : 'string')
								case DateApproach.BlindDate:
									return new context.NativeType(nullable ? 'LocalDateString | null' : 'LocalDateString')
							}
							throw new Error(`Unsupported date approach: ${generatorOptions.dateApproach}`)
						case 'time':
							switch (generatorOptions.dateApproach) {
								case DateApproach.Native:
								case DateApproach.String:
									/* We use strings for date and time as JavaScript Date can't support */
									return new context.NativeType(nullable ? 'string | null' : 'string')
								case DateApproach.BlindDate:
									return new context.NativeType(nullable ? 'LocalTimeString | null' : 'LocalTimeString')
							}
							throw new Error(`Unsupported date approach: ${generatorOptions.dateApproach}`)
						case 'date-time':
							switch (generatorOptions.dateApproach) {
								case DateApproach.Native:
									/* We don't have a mapping library to convert incoming and outgoing JSON, so the rawType of dates is string */
									return new context.NativeType(nullable ? 'Date | null' : 'Date', {
										serializedType: 'string',
									})
								case DateApproach.BlindDate:
									return new context.NativeType(nullable ? 'OffsetDateTimeString | null' : 'OffsetDateTimeString')
								case DateApproach.String:
									return new context.NativeType(nullable ? 'string | null' : 'string')
							}
							throw new Error(`Unsupported date approach: ${generatorOptions.dateApproach}`)
						default:
							return new context.NativeType(nullable ? 'string | null' : 'string')
					}
				}
				case 'boolean': {
					return new context.NativeType(nullable ? 'boolean | null' : 'boolean')
				}
				case 'file': {
					/* JavaScript does have a File type, but it isn't supported by JSON serialization so we don't have a serializedType */
					return new context.NativeType(nullable ? 'File | null' : 'File', {
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
		defaultValue: (options) => {
			const { schemaType, required } = options

			if (!required) {
				return { value: null, literalValue: 'undefined' }
			}

			switch (schemaType) {
				case CodegenSchemaType.NUMBER:
					return { value: 0.0, literalValue: context.generator().toLiteral(0.0, options) }
				case CodegenSchemaType.INTEGER:
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
		initialValue: (options) => {
			const { schemaType, required } = options

			if (!required) {
				return null
			}

			switch (schemaType) {
				case CodegenSchemaType.NUMBER:
					return { value: 0.0, literalValue: context.generator().toLiteral(0.0, options) }
				case CodegenSchemaType.INTEGER:
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

		postProcessSchema: (schema) => {
			function modelReferencesToDisjunction(references: CodegenObjectSchemaReference[], transform: (nativeType: CodegenNativeType) => string | null): string | null {
				const result = references.reduce((result, reference) => {
					const r = transform(reference.model.nativeType)
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
					return null
				}
			}

			function modelsToDisjunction(models: CodegenSchema[], transform: (nativeType: CodegenNativeType) => string | null): string | null {
				const result = models.reduce((result, model) => {
					const r = transform(model.nativeType)
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
					return null
				}
			}

			if (isCodegenObjectSchema(schema) && schema.discriminator) {
				/* If this model has a discriminator then we change its propertyNativeType to a disjunction */
				if (schema.discriminator.references) {
					const newNativeType = modelReferencesToDisjunction(schema.discriminator.references, (nativeType) => nativeType.nativeType)
					if (newNativeType) {
						if (!tryToConvertModelToLiteralType(schema, newNativeType)) {
							schema.nativeType.nativeType = newNativeType
							schema.nativeType.serializedType = modelReferencesToDisjunction(schema.discriminator.references, (nativeType) => nativeType.serializedType)
							schema.nativeType.literalType = modelReferencesToDisjunction(schema.discriminator.references, (nativeType) => nativeType.literalType)
							schema.nativeType.concreteType = modelReferencesToDisjunction(schema.discriminator.references, (nativeType) => nativeType.concreteType)
							
							if (schema.nativeType.componentType && schema.nativeType.componentType !== schema.nativeType) {
								schema.nativeType.componentType.nativeType = modelReferencesToDisjunction(schema.discriminator.references, (nativeType) => nativeType.componentType ? nativeType.componentType.nativeType : nativeType.nativeType)!
								schema.nativeType.componentType.serializedType = modelReferencesToDisjunction(schema.discriminator.references, (nativeType) => nativeType.componentType ? nativeType.componentType.serializedType : nativeType.serializedType)
								schema.nativeType.componentType.literalType = modelReferencesToDisjunction(schema.discriminator.references, (nativeType) => nativeType.componentType ? nativeType.componentType.literalType : nativeType.literalType)
								schema.nativeType.componentType.concreteType = modelReferencesToDisjunction(schema.discriminator.references, (nativeType) => nativeType.componentType ? nativeType.componentType.concreteType : nativeType.concreteType)
							}
						}
					}
				}
			} else if (isCodegenObjectSchema(schema) && schema.implementors && !schema.properties && !schema.parent) {
				/* If this model is a parent interface for others, but has no properties of its own, then we can convert it to a disjunction */
				const implementors = idx.allValues(schema.implementors)

				const newNativeType = modelsToDisjunction(implementors, (nativeType) => nativeType.nativeType)
				if (newNativeType) {
					if (!tryToConvertModelToLiteralType(schema, newNativeType)) {
						schema.nativeType.nativeType = newNativeType
						schema.nativeType.serializedType = modelsToDisjunction(implementors, (nativeType) => nativeType.serializedType)
						schema.nativeType.literalType = modelsToDisjunction(implementors, (nativeType) => nativeType.literalType)
						schema.nativeType.concreteType = modelsToDisjunction(implementors, (nativeType) => nativeType.concreteType)
						
						if (schema.nativeType.componentType && schema.nativeType.componentType !== schema.nativeType) {
							schema.nativeType.componentType.nativeType = modelsToDisjunction(implementors, (nativeType) => nativeType.componentType ? nativeType.componentType.nativeType : nativeType.nativeType)!
							schema.nativeType.componentType.serializedType = modelsToDisjunction(implementors, (nativeType) => nativeType.componentType ? nativeType.componentType.serializedType : nativeType.serializedType)
							schema.nativeType.componentType.literalType = modelsToDisjunction(implementors, (nativeType) => nativeType.componentType ? nativeType.componentType.literalType : nativeType.literalType)
							schema.nativeType.componentType.concreteType = modelsToDisjunction(implementors, (nativeType) => nativeType.componentType ? nativeType.componentType.concreteType : nativeType.concreteType)
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
function tryToConvertModelToLiteralType(model: CodegenObjectSchema, literalType: string) {
	if (!model.properties && !model.implements && !model.parent) {
		if (!model.vendorExtensions) {
			model.vendorExtensions = idx.create()
		}
		idx.set(model.vendorExtensions, 'convert-to-literal-type', literalType)

		if (model.implementors) {
			for (const other of idx.values(model.implementors)) {
				if (isCodegenObjectSchema(other) && other.implements) {
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

