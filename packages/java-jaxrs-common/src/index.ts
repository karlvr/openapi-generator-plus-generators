import { CodegenRootContext, CodegenPropertyType, CodegenConfig, CodegenGeneratorContext, CodegenDocument, CodegenState, CodegenGenerator } from '@openapi-generator-plus/types'
import { CodegenOptionsJava } from './types'
import path from 'path'
import Handlebars from 'handlebars'
import { loadTemplates, emit, registerStandardHelpers } from '@openapi-generator-plus/handlebars-templates'
import { javaLikeGenerator, ConstantStyle, options as javaLikeOptions, JavaLikeContext } from '@openapi-generator-plus/java-like-generator-helper'
import { commonGenerator } from '@openapi-generator-plus/generator-common'

export { CodegenOptionsJava } from './types'

function escapeString(value: string) {
	if (typeof value !== 'string') {
		throw new Error(`escapeString called with non-string: ${typeof value} (${value})`)
	}

	value = value.replace(/\\/g, '\\\\')
	value = value.replace(/"/g, '\\"')
	value = value.replace(/\n/g, '\\n')
	return value
}

/**
 * Turns a Java package name into a path
 * @param packageName Java package name
 */
export function packageToPath(packageName: string) {
	return packageName.replace(/\./g, path.sep)
}

function computeCustomTemplatesPath(configPath: string | undefined, customTemplatesPath: string) {
	if (configPath) {
		return path.resolve(path.dirname(configPath), customTemplatesPath) 
	} else {
		return customTemplatesPath
	}
}

function computeRelativeSourceOutputPath(config: CodegenConfig) {
	const maven = config.maven
	const defaultPath = maven ? path.join('src', 'main', 'java') : ''
	
	return config.relativeSourceOutputPath !== undefined ? config.relativeSourceOutputPath : defaultPath
}

function computeRelativeResourcesOutputPath(config: CodegenConfig) {
	const maven = config.maven
	const defaultPath = maven ? path.join('src', 'main', 'resources') : undefined
	
	return config.relativeResourcesOutputPath !== undefined ? config.relativeResourcesOutputPath : defaultPath
}

function computeRelativeTestOutputPath(config: CodegenConfig) {
	const maven = config.maven
	const defaultPath = maven ? path.join('src', 'test', 'java') : ''
	
	return config.relativeTestOutputPath !== undefined ? config.relativeTestOutputPath : defaultPath
}

function computeRelativeTestResourcesOutputPath(config: CodegenConfig) {
	const maven = config.maven
	const defaultPath = maven ? path.join('src', 'test', 'resources') : undefined
	
	return config.relativeTestResourcesOutputPath !== undefined ? config.relativeTestResourcesOutputPath : defaultPath
}

export interface JavaGeneratorContext<O extends CodegenOptionsJava> extends CodegenGeneratorContext {
	loadAdditionalTemplates?: (hbs: typeof Handlebars) => Promise<void>
	customiseRootContext?: (rootContext: CodegenRootContext) => Promise<void>
	additionalWatchPaths?: (config: CodegenConfig) => string[]
	additionalExportTemplates?: (outputPath: string, doc: CodegenDocument, hbs: typeof Handlebars, rootContext: CodegenRootContext, state: CodegenState<O>) => Promise<void>
	transformOptions?: (config: CodegenConfig, options: CodegenOptionsJava) => O
}

const RESERVED_WORDS = [
	'abstract', 'assert', 'boolean', 'break', 'byte', 'case',
	'catch', 'char', 'class', 'const', 'continue', 'default',
	'double', 'do', 'else', 'enum', 'extends', 'false',
	'final', 'finally', 'float', 'for', 'goto', 'if',
	'implements', 'import', 'instanceof', 'int', 'interface', 'long',
	'native', 'new', 'null', 'package', 'private', 'protected',
	'public', 'return', 'short', 'static', 'strictfp', 'super',
	'switch', 'synchronized', 'this', 'throw', 'throws', 'transient',
	'true', 'try', 'void', 'volatile', 'while',
]

export default function createGenerator<O extends CodegenOptionsJava>(context: JavaGeneratorContext<O>): Omit<CodegenGenerator<O>, 'generatorType'> {
	const javaLikeContext: JavaLikeContext<O> = {
		reservedWords: () => RESERVED_WORDS,
		defaultConstantStyle: ConstantStyle.allCapsSnake,
	}

	return {
		...context.baseGenerator(),
		...commonGenerator(),
		...javaLikeGenerator(javaLikeContext),
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
					if (typeof value !== 'number') {
						throw new Error(`toLiteral with type integer called with non-number: ${typeof value} (${value})`)
					}

					if (format === 'int32' || format === undefined) {
						return !required ? `java.lang.Integer.valueOf(${value})` : `${value}`
					} else if (format === 'int64') {
						return !required ? `java.lang.Long.valueOf(${value}l)` : `${value}l`
					} else {
						throw new Error(`Unsupported ${type} format: ${format}`)
					}
				}
				case 'number': {
					if (typeof value !== 'number') {
						throw new Error(`toLiteral with type number called with non-number: ${typeof value} (${value})`)
					}

					if (format === undefined) {
						return `new java.math.BigDecimal("${value}")`
					} else if (format === 'float') {
						return !required ? `java.lang.Float.valueOf(${value}f)` : `${value}f`
					} else if (format === 'double') {
						return !required ? `java.lang.Double.valueOf(${value}d)` : `${value}d`
					} else {
						throw new Error(`Unsupported ${type} format: ${format}`)
					}
				}
				case 'string': {
					if (typeof value !== 'string') {
						throw new Error(`toLiteral with type string called with non-string: ${typeof value} (${value})`)
					}

					if (format === 'byte') {
						return !required ? `java.lang.Byte.valueOf(${value}b)` : `${value}b`
					} else if (format === 'binary') {
						throw new Error(`Cannot format literal for type ${type} format ${format}`)
					} else if (format === 'date') {
						return `${state.options.dateImplementation}.parse("${value}")`
					} else if (format === 'time') {
						return `${state.options.timeImplementation}.parse("${value}")`
					} else if (format === 'date-time') {
						return `${state.options.dateTimeImplementation}.parse("${value}")`
					} else {
						return `"${escapeString(value)}"`
					}
				}
				case 'boolean':
					if (typeof value !== 'boolean') {
						throw new Error(`toLiteral with type boolean called with non-boolean: ${typeof value} (${value})`)
					}

					return !required ? `java.lang.Boolean.valueOf(${value})` : `${value}`
				case 'object':
				case 'file':
					throw new Error(`Cannot format literal for type ${type}`)
			}
	
			throw new Error(`Unsupported type name: ${type}`)
		},
		toNativeType: ({ type, format, required }, state) => {
			/* See https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#data-types */
			switch (type) {
				case 'integer': {
					if (format === 'int32' || format === undefined) {
						return new context.NativeType(!required ? 'java.lang.Integer' : 'int', {
							componentType: new context.NativeType('java.lang.Integer'),
						})
					} else if (format === 'int64') {
						return new context.NativeType(!required ? 'java.lang.Long' : 'long', {
							componentType: new context.NativeType('java.lang.Long'),
						})
					} else {
						throw new Error(`Unsupported ${type} format: ${format}`)
					}
				}
				case 'number': {
					if (format === undefined) {
						return new context.NativeType('java.math.BigDecimal')
					} else if (format === 'float') {
						return new context.NativeType(!required ? 'java.lang.Float' : 'float', {
							componentType: new context.NativeType('java.lang.Float'),
						})
					} else if (format === 'double') {
						return new context.NativeType(!required ? 'java.lang.Double' : 'double', {
							componentType: new context.NativeType('java.lang.Double'),
						})
					} else {
						throw new Error(`Unsupported ${type} format: ${format}`)
					}
				}
				case 'string': {
					if (format === 'byte') {
						return new context.NativeType(!required ? 'java.lang.Byte' : 'byte', {
							componentType: new context.NativeType('java.lang.Byte'),
							wireType: 'java.lang.String',
						})
					} else if (format === 'binary') {
						return new context.NativeType('java.lang.String')
					} else if (format === 'date') {
						return new context.NativeType(state.options.dateImplementation, {
							wireType: 'java.lang.String',
						})
					} else if (format === 'time') {
						return new context.NativeType(state.options.timeImplementation, {
							wireType: 'java.lang.String',
						})
					} else if (format === 'date-time') {
						return new context.NativeType(state.options.dateTimeImplementation, {
							wireType: 'java.lang.String',
						})
					} else if (format === 'uuid') {
						return new context.NativeType('java.util.UUID', {
							wireType: 'java.lang.String',
						})
					} else if (format === 'url') {
						return new context.NativeType('java.net.URL', {
							wireType: 'java.lang.String',
						})
					} else {
						return new context.NativeType('java.lang.String')
					}
				}
				case 'boolean': {
					return new context.NativeType(!required ? 'java.lang.Boolean' : 'boolean', {
						componentType: new context.NativeType('java.lang.Boolean'),
					})
				}
				case 'file': {
					return new context.NativeType('java.io.InputStream')
				}
			}
	
			throw new Error(`Unsupported type name: ${type}`)
		},
		toNativeObjectType: function({ modelNames }, state) {
			let modelName = `${state.options.modelPackage}`
			for (const name of modelNames) {
				modelName += `.${state.generator.toClassName(name, state)}`
			}
			return new context.NativeType(modelName)
		},
		toNativeArrayType: ({ componentNativeType, uniqueItems }) => {
			if (uniqueItems) {
				return new context.FullTransformingNativeType(componentNativeType, {
					nativeType: (nativeType) => `java.util.List<${(nativeType.componentType || nativeType).nativeType}>`,
					literalType: () => 'java.util.List',
					concreteType: (nativeType) => `java.util.ArrayList<${(nativeType.componentType || nativeType).nativeType}>`,
				})
			} else {
				return new context.FullTransformingNativeType(componentNativeType, {
					nativeType: (nativeType) => `java.util.List<${(nativeType.componentType || nativeType).nativeType}>`,
					literalType: () => 'java.util.List',
					concreteType: (nativeType) => `java.util.ArrayList<${(nativeType.componentType || nativeType).nativeType}>`,
				})
			}
		},
		toNativeMapType: ({ keyNativeType, componentNativeType }) => {
			return new context.FullComposingNativeType([keyNativeType, componentNativeType], {
				nativeType: ([keyNativeType, componentNativeType]) => `java.util.Map<${(keyNativeType.componentType || keyNativeType).nativeType}, ${(componentNativeType.componentType || componentNativeType).nativeType}>`,
				literalType: () => 'java.util.Map',
				concreteType: ([keyNativeType, componentNativeType]) => `java.util.HashMap<${(keyNativeType.componentType || keyNativeType).nativeType}, ${(componentNativeType.componentType || componentNativeType).nativeType}>`,
			})
		},
		toDefaultValue: (defaultValue, options, state) => {
			if (defaultValue !== undefined) {
				return {
					value: defaultValue,
					literalValue: state.generator.toLiteral(defaultValue, options, state),
				}
			}
	
			const { type, required, propertyType, nativeType } = options
	
			if (!required) {
				return { value: null, literalValue: 'null' }
			}
	
			switch (propertyType) {
				case CodegenPropertyType.ENUM:
				case CodegenPropertyType.OBJECT:
				case CodegenPropertyType.DATE:
				case CodegenPropertyType.TIME:
				case CodegenPropertyType.DATETIME:
				case CodegenPropertyType.FILE:
				case CodegenPropertyType.STRING:
					return { value: null, literalValue: 'null' }
				case CodegenPropertyType.ARRAY:
				case CodegenPropertyType.MAP:
					return { literalValue: `new ${nativeType.concreteType}()` }
				case CodegenPropertyType.NUMBER:
					return { value: 0, literalValue: state.generator.toLiteral(0, options, state) }
				case CodegenPropertyType.BOOLEAN:
					return { value: false, literalValue: state.generator.toLiteral(false, options, state) }
			}
	
			throw new Error(`Unsupported type name: ${type}`)
		},
		options: (config): O => {
			const packageName = config.package || 'com.example'
			const options: CodegenOptionsJava = {
				...javaLikeOptions(config, javaLikeContext),
				apiPackage: config.apiPackage || `${packageName}`,
				modelPackage: config.modelPackage || `${packageName}.model`,
				useBeanValidation: config.useBeanValidation !== undefined ? config.useBeanValidation : true,
				includeTests: config.includeTests !== undefined ? config.includeTests : false,
				dateImplementation: config.dateImplementation || 'java.time.LocalDate',
				timeImplementation: config.timeImplementation || 'java.time.LocalTime',
				dateTimeImplementation: config.dateTimeImplementation || 'java.time.OffsetDateTime',
				hideGenerationTimestamp: config.hideGenerationTimestamp !== undefined ? config.hideGenerationTimestamp : false,
				imports: config.imports,
				maven: config.maven && {
					groupId: config.maven.groupId || 'com.example',
					artifactId: config.maven.artifactId || 'api',
					version: config.maven.version || '0.0.1',
					versions: config.maven.versions || {},
				},
				relativeSourceOutputPath: computeRelativeSourceOutputPath(config),
				relativeResourcesOutputPath: computeRelativeResourcesOutputPath(config),
				relativeTestOutputPath: computeRelativeTestOutputPath(config),
				relativeTestResourcesOutputPath: computeRelativeTestResourcesOutputPath(config),
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
			return context.operationGroupingStrategies.addToGroupsByPath
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
	
		cleanPathPatterns: (options) => {
			const relativeSourceOutputPath = options.relativeSourceOutputPath
			
			const apiPackagePath = packageToPath(options.apiPackage)
			const modelPackagePath = packageToPath(options.modelPackage)
	
			return [
				path.join(relativeSourceOutputPath, apiPackagePath, '*Api.java'),
				path.join(relativeSourceOutputPath, apiPackagePath, '*ApiImpl.java'),
				path.join(relativeSourceOutputPath, apiPackagePath, '*ApiService.java'),
				path.join(relativeSourceOutputPath, modelPackagePath, '*.java'),
			]
		},
	
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
				generatorClass: '@openapi-generator-plus/java-jaxrs-generator',
				generatedDate: new Date().toISOString(),
			}
			if (context.customiseRootContext) {
				await context.customiseRootContext(rootContext)
			}
	
			const relativeSourceOutputPath = state.options.relativeSourceOutputPath
			const relativeTestOutputPath = state.options.relativeTestOutputPath
	
			const apiPackagePath = packageToPath(state.options.apiPackage)
			for (const group of doc.groups) {
				const operations = group.operations
				if (!operations.length) {
					continue
				}
				await emit('api', path.join(outputPath, relativeSourceOutputPath, apiPackagePath, `${state.generator.toClassName(group.name, state)}Api.java`), 
					{ ...group, operations, ...state.options, ...rootContext }, true, hbs)
			}
	
			const modelPackagePath = packageToPath(state.options.modelPackage)
			for (const model of context.utils.values(doc.models)) {
				const context = {
					models: [model],
				}
				await emit('model', path.join(outputPath, relativeSourceOutputPath, modelPackagePath, `${state.generator.toClassName(model.name, state)}.java`), 
					{ ...context, ...state.options, ...rootContext }, true, hbs)
			}
	
			const maven = state.options.maven
			if (maven) {
				await emit('pom', path.join(outputPath, 'pom.xml'), { ...maven, ...state.options, ...rootContext }, false, hbs)
			}
			
			if (state.options.includeTests && hbs.partials['tests/apiTest']) {
				for (const group of doc.groups) {
					const operations = group.operations
					if (!operations.length) {
						continue
					}
					await emit('tests/apiTest', path.join(outputPath, relativeTestOutputPath, apiPackagePath, `${state.generator.toClassName(group.name, state)}ApiTest.java`),
						{ ...group, ...state.options, ...rootContext }, false, hbs)
				}
			}
	
			if (context.additionalExportTemplates) {
				await context.additionalExportTemplates(outputPath, doc, hbs, rootContext, state)
			}
		},
	}
}
