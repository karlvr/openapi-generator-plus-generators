import { CodegenSchemaType, CodegenConfig, CodegenGeneratorContext, CodegenDocument, CodegenGenerator } from '@openapi-generator-plus/types'
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
export function packageToPath(packageName: string): string {
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

export interface JavaGeneratorContext extends CodegenGeneratorContext {
	loadAdditionalTemplates?: (hbs: typeof Handlebars) => Promise<void>
	additionalWatchPaths?: () => string[]
	additionalExportTemplates?: (outputPath: string, doc: CodegenDocument, hbs: typeof Handlebars, rootContext: Record<string, unknown>) => Promise<void>
	additionalCleanPathPatterns?: () => string[]
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

export function options(config: CodegenConfig, context: JavaGeneratorContext): CodegenOptionsJava {
	const packageName = config.package || 'com.example'
	const apiPackage = config.apiPackage || `${packageName}`
	const options: CodegenOptionsJava = {
		...javaLikeOptions(config, createJavaLikeContext(context)),
		apiPackage,
		apiImplPackage: config.apiImplPackage || `${apiPackage}.impl`,
		modelPackage: config.modelPackage || `${packageName}.model`,
		useBeanValidation: config.useBeanValidation !== undefined ? config.useBeanValidation : true,
		includeTests: config.includeTests !== undefined ? config.includeTests : false,
		dateImplementation: config.dateImplementation || 'java.time.LocalDate',
		timeImplementation: config.timeImplementation || 'java.time.LocalTime',
		dateTimeImplementation: config.dateTimeImplementation || 'java.time.OffsetDateTime',
		hideGenerationTimestamp: config.hideGenerationTimestamp !== undefined ? config.hideGenerationTimestamp : false,
		imports: config.imports || null,
		maven: config.maven ? {
			groupId: config.maven.groupId || 'com.example',
			artifactId: config.maven.artifactId || 'api',
			version: config.maven.version || '0.0.1',
			versions: config.maven.versions || {},
		} : null,
		relativeSourceOutputPath: computeRelativeSourceOutputPath(config),
		relativeResourcesOutputPath: computeRelativeResourcesOutputPath(config),
		relativeTestOutputPath: computeRelativeTestOutputPath(config),
		relativeTestResourcesOutputPath: computeRelativeTestResourcesOutputPath(config),
		customTemplatesPath: config.customTemplates && computeCustomTemplatesPath(config.configPath, config.customTemplates),
	}

	return options
}

function createJavaLikeContext(context: JavaGeneratorContext): JavaLikeContext {
	const javaLikeContext: JavaLikeContext = {
		...context,
		reservedWords: () => RESERVED_WORDS,
		defaultConstantStyle: ConstantStyle.allCapsSnake,
	}
	return javaLikeContext
}

export default function createGenerator(config: CodegenConfig, context: JavaGeneratorContext): Omit<CodegenGenerator, 'generatorType'> {
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
	
			const { type, format, required, schemaType } = options
	
			if (schemaType === CodegenSchemaType.ENUM) {
				return `${options.nativeType.toString()}.${context.generator().toEnumMemberName(value)}`
			}
	
			switch (type) {
				case 'integer': {
					if (typeof value !== 'number') {
						throw new Error(`toLiteral with type integer called with non-number: ${typeof value} (${value})`)
					}

					if (format === 'int32' || !format) {
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

					if (!format) {
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
						return `${generatorOptions.dateImplementation}.parse("${value}")`
					} else if (format === 'time') {
						return `${generatorOptions.timeImplementation}.parse("${value}")`
					} else if (format === 'date-time') {
						return `${generatorOptions.dateTimeImplementation}.parse("${value}")`
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
		toNativeType: ({ type, format, required, vendorExtensions }) => {
			if (vendorExtensions && vendorExtensions['x-java-type']) {
				return new context.NativeType(vendorExtensions['x-java-type'], {
					componentType: new context.NativeType(vendorExtensions['x-java-type']),
				})
			}
			
			/* See https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#data-types */
			switch (type) {
				case 'integer': {
					if (format === 'int32' || !format) {
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
					if (!format) {
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
							serializedType: 'java.lang.String',
						})
					} else if (format === 'binary') {
						return new context.NativeType('java.lang.String')
					} else if (format === 'date') {
						return new context.NativeType(generatorOptions.dateImplementation, {
							serializedType: 'java.lang.String',
						})
					} else if (format === 'time') {
						return new context.NativeType(generatorOptions.timeImplementation, {
							serializedType: 'java.lang.String',
						})
					} else if (format === 'date-time') {
						return new context.NativeType(generatorOptions.dateTimeImplementation, {
							serializedType: 'java.lang.String',
						})
					} else if (format === 'uuid') {
						return new context.NativeType('java.util.UUID', {
							serializedType: 'java.lang.String',
						})
					} else if (format === 'url') {
						return new context.NativeType('java.net.URL', {
							serializedType: 'java.lang.String',
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
		toNativeObjectType: function({ modelNames }) {
			let modelName = `${generatorOptions.modelPackage}`
			for (const name of modelNames) {
				modelName += `.${context.generator().toClassName(name)}`
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
		toDefaultValue: (defaultValue, options) => {
			if (defaultValue !== undefined) {
				return {
					value: defaultValue,
					literalValue: context.generator().toLiteral(defaultValue, options),
				}
			}
	
			const { type, required, schemaType, nativeType } = options
	
			if (!required) {
				return { value: null, literalValue: 'null' }
			}
	
			switch (schemaType) {
				case CodegenSchemaType.ENUM:
				case CodegenSchemaType.OBJECT:
				case CodegenSchemaType.DATE:
				case CodegenSchemaType.TIME:
				case CodegenSchemaType.DATETIME:
				case CodegenSchemaType.FILE:
				case CodegenSchemaType.STRING:
					return { value: null, literalValue: 'null' }
				case CodegenSchemaType.ARRAY:
					return { value: [], literalValue: `new ${nativeType.concreteType}()` }
				case CodegenSchemaType.MAP:
					return { value: {}, literalValue: `new ${nativeType.concreteType}()` }
				case CodegenSchemaType.NUMBER:
					return { value: 0, literalValue: context.generator().toLiteral(0, options) }
				case CodegenSchemaType.BOOLEAN:
					return { value: false, literalValue: context.generator().toLiteral(false, options) }
			}
	
			throw new Error(`Unsupported type name: ${type}`)
		},
		
		operationGroupingStrategy: () => {
			return context.operationGroupingStrategies.addToGroupsByPath
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
	
		cleanPathPatterns: () => {
			const relativeSourceOutputPath = generatorOptions.relativeSourceOutputPath
			
			const apiPackagePath = packageToPath(generatorOptions.apiPackage)
			const apiImplPackagePath = packageToPath(generatorOptions.apiImplPackage)
			const modelPackagePath = packageToPath(generatorOptions.modelPackage)
	
			const result = [
				path.join(relativeSourceOutputPath, apiPackagePath, '*Api.java'),
				path.join(relativeSourceOutputPath, apiImplPackagePath, '*ApiImpl.java'),
				path.join(relativeSourceOutputPath, modelPackagePath, '*.java'),
			]
			if (context.additionalCleanPathPatterns) {
				result.push(...context.additionalCleanPathPatterns())
			}
			return result
		},

		templateRootContext: () => {
			return {
				...aCommonGenerator.templateRootContext(),
				...generatorOptions,
				generatorClass: '@openapi-generator-plus/java-jaxrs-generator',
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
	
			const relativeSourceOutputPath = generatorOptions.relativeSourceOutputPath
			const relativeTestOutputPath = generatorOptions.relativeTestOutputPath
	
			const modelPackagePath = packageToPath(generatorOptions.modelPackage)
			for (const model of context.utils.values(doc.models)) {
				const modelContext = {
					models: [model],
				}
				await emit('model', path.join(outputPath, relativeSourceOutputPath, modelPackagePath, `${context.generator().toClassName(model.name)}.java`), 
					{ ...rootContext, ...modelContext }, true, hbs)
			}
	
			const maven = generatorOptions.maven
			if (maven) {
				await emit('pom', path.join(outputPath, 'pom.xml'), { ...rootContext, ...maven }, false, hbs)
			}
			
			if (generatorOptions.includeTests && hbs.partials['tests/apiTest']) {
				const apiPackagePath = packageToPath(generatorOptions.apiPackage)
				for (const group of doc.groups) {
					const operations = group.operations
					if (!operations.length) {
						continue
					}
					await emit('tests/apiTest', path.join(outputPath, relativeTestOutputPath, apiPackagePath, `${context.generator().toClassName(group.name)}ApiTest.java`),
						{ ...rootContext, ...group }, false, hbs)
				}
			}
	
			if (context.additionalExportTemplates) {
				await context.additionalExportTemplates(outputPath, doc, hbs, rootContext)
			}
		},
	}
}
