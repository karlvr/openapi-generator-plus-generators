import { CodegenSchemaType, CodegenConfig, CodegenGeneratorContext, CodegenDocument, CodegenGenerator, isCodegenObjectSchema, isCodegenEnumSchema, CodegenNativeType, CodegenProperty, CodegenAllOfStrategy, CodegenAnyOfStrategy, CodegenOneOfStrategy, CodegenLogLevel, isCodegenInterfaceSchema, isCodegenWrapperSchema, CodegenGeneratorType } from '@openapi-generator-plus/types'
import { CodegenOptionsJava } from './types'
import path from 'path'
import Handlebars from 'handlebars'
import { loadTemplates, emit, registerStandardHelpers, sourcePosition, ActualHelperOptions } from '@openapi-generator-plus/handlebars-templates'
import { javaLikeGenerator, ConstantStyle, options as javaLikeOptions, JavaLikeContext } from '@openapi-generator-plus/java-like-generator-helper'
import { capitalize, commonGenerator, configBoolean, configNumber, configObject, configString, configStringArray, debugStringify } from '@openapi-generator-plus/generator-common'

export { CodegenOptionsJava } from './types'

function escapeString(value: string | number | boolean) {
	if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
		throw new Error(`escapeString called with unsupported type: ${typeof value} (${value})`)
	}

	value = String(value)
	value = value.replace(/\\/g, '\\\\')
	value = value.replace(/"/g, '\\"')
	value = value.replace(/\r/g, '\\r')
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
	
	return configString(config, 'relativeSourceOutputPath', defaultPath)
}

function computeRelativeResourcesOutputPath(config: CodegenConfig) {
	const maven = config.maven
	const defaultPath = maven ? path.join('src', 'main', 'resources') : undefined
	
	return configString(config, 'relativeResourcesOutputPath', defaultPath)
}

function computeRelativeTestOutputPath(config: CodegenConfig) {
	const maven = config.maven
	const defaultPath = maven ? path.join('src', 'test', 'java') : ''
	
	return configString(config, 'relativeTestOutputPath', defaultPath)
}

function computeRelativeTestResourcesOutputPath(config: CodegenConfig) {
	const maven = config.maven
	const defaultPath = maven ? path.join('src', 'test', 'resources') : undefined
	
	return configString(config, 'relativeTestResourcesOutputPath', defaultPath)
}

export interface JavaGeneratorContext extends CodegenGeneratorContext {
	loadAdditionalTemplates?: (hbs: typeof Handlebars) => Promise<void>
	additionalWatchPaths?: () => string[]
	additionalExportTemplates?: (outputPath: string, doc: CodegenDocument, hbs: typeof Handlebars, rootContext: Record<string, unknown>) => Promise<void>
	additionalCleanPathPatterns?: () => string[]
	/**
	 * Override the class used to capture application/x-www-form-urlencoded messages.
	 */
	formUrlEncodedImplementation?: () => CodegenNativeType
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
	const packageName = configString(config, 'package', 'com.example')
	const apiPackage = configString(config, 'apiPackage', packageName)
	const maven = configObject(config, 'maven', undefined)
	const customTemplates = configString(config, 'customTemplates', undefined)
	const options: CodegenOptionsJava = {
		...javaLikeOptions(config, createJavaLikeContext(context)),
		apiPackage,
		apiImplPackage: configString(config, 'apiImplPackage', `${apiPackage}.impl`),
		modelPackage: configString(config, 'modelPackage', `${packageName}.model`),
		useBeanValidation: configBoolean(config, 'useBeanValidation', true),
		validationPackage: configString(config, 'validationPackage', `${packageName}.validation`),
		includeTests: configBoolean(config, 'includeTests', false),
		junitVersion: configNumber(config, 'junitVersion', 5),
		dateImplementation: configString(config, 'dateImplementation', 'java.time.LocalDate'),
		timeImplementation: configString(config, 'timeImplementation', 'java.time.LocalTime'),
		dateTimeImplementation: configString(config, 'dateTimeImplementation', 'java.time.OffsetDateTime'),
		binaryRepresentation: configString(config, 'binaryRepresentation', 'byte[]'),
		hideGenerationTimestamp: configBoolean(config, 'hideGenerationTimestamp', false),
		imports: configStringArray(config, 'imports', null),
		maven: maven ? {
			groupId: configString(maven, 'groupId', 'com.example', 'maven.'),
			artifactId: configString(maven, 'artifactId', 'api', 'maven.'), 
			version: configString(maven, 'version', '0.0.1', 'maven.'),
			versions: configObject(maven, 'versions', {}, 'maven.'),
		} : null,
		relativeSourceOutputPath: computeRelativeSourceOutputPath(config),
		relativeResourcesOutputPath: computeRelativeResourcesOutputPath(config),
		relativeTestOutputPath: computeRelativeTestOutputPath(config),
		relativeTestResourcesOutputPath: computeRelativeTestResourcesOutputPath(config),
		customTemplatesPath: customTemplates && computeCustomTemplatesPath(config.configPath, customTemplates),
		useJakarta: configBoolean(config, 'useJakarta', false),
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

	const baseGenerator = context.baseGenerator(config, context)
	const aCommonGenerator = commonGenerator(config, context)

	return {
		...baseGenerator,
		...aCommonGenerator,
		...javaLikeGenerator(config, createJavaLikeContext(context)),
		toLiteral: (value, options) => {
			if (value === undefined) {
				const defaultValue = context.generator().defaultValue(options)
				if (defaultValue === null) {
					return null
				}
				return defaultValue.literalValue
			}
	
			const { type, format, required, nullable, schemaType } = options
			if (value === null) {
				if (nullable) {
					return 'null'
				}

				const defaultValue = context.generator().defaultValue(options)
				if (defaultValue === null) {
					return null
				}
				return defaultValue.literalValue
			}
	
			if (schemaType === CodegenSchemaType.ENUM) {
				return `${options.nativeType.concreteType}.${context.generator().toEnumMemberName(String(value))}`
			}

			/* We use the same logic as in nativeTypeUsageTransformer  */
			const primitive = required && !nullable
	
			switch (type) {
				case 'integer': {
					if (typeof value === 'string') {
						const parsedValue = parseInt(value)
						if (isNaN(parsedValue)) {
							throw new Error(`toLiteral with type integer called with non-number: ${typeof value} (${value})`)
						}
						value = parsedValue
					}
					if (typeof value !== 'number') {
						throw new Error(`toLiteral with type integer called with non-number: ${typeof value} (${value})`)
					}

					if (format === 'int32' || !format) {
						return !primitive ? `java.lang.Integer.valueOf(${value})` : `${value}`
					} else if (format === 'int64') {
						return !primitive ? `java.lang.Long.valueOf(${value}l)` : `${value}l`
					} else {
						throw new Error(`Unsupported ${type} format: ${format}`)
					}
				}
				case 'number': {
					if (typeof value === 'string') {
						const parsedValue = parseFloat(value)
						if (isNaN(parsedValue)) {
							throw new Error(`toLiteral with type number called with non-number: ${typeof value} (${value})`)
						}
						value = parsedValue
					}
					if (typeof value !== 'number') {
						throw new Error(`toLiteral with type number called with non-number: ${typeof value} (${value})`)
					}

					if (!format) {
						return `new java.math.BigDecimal("${value}")`
					} else if (format === 'float') {
						return !primitive ? `java.lang.Float.valueOf(${value}f)` : `${value}f`
					} else if (format === 'double') {
						return !primitive ? `java.lang.Double.valueOf(${value}d)` : `${value}d`
					} else {
						throw new Error(`Unsupported ${type} format: ${format}`)
					}
				}
				case 'string': {
					if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
						throw new Error(`toLiteral with type string called with unsupported type: ${typeof value} (${value})`)
					}

					if (format === 'byte') {
						return `"${escapeString(value)}"`
					} else if (format === 'binary') {
						return `"${escapeString(value)}".getBytes(java.nio.charset.StandardCharsets.UTF_8)`
					} else if (format === 'date') {
						return `${generatorOptions.dateImplementation}.parse("${escapeString(value)}")`
					} else if (format === 'time') {
						return `${generatorOptions.timeImplementation}.parse("${escapeString(value)}")`
					} else if (format === 'date-time') {
						return `${generatorOptions.dateTimeImplementation}.parse("${escapeString(value)}")`
					} else if (format === 'uuid') {
						return `java.util.UUID.fromString("${escapeString(value)}")`
					} else {
						return `"${escapeString(value)}"`
					}
				}
				case 'boolean':
					if (typeof value === 'string') {
						value = value.toLowerCase() === 'true'
					}
					if (typeof value === 'number') {
						value = value !== 0
					}
					if (typeof value !== 'boolean') {
						throw new Error(`toLiteral with type boolean called with non-boolean: ${typeof value} (${value})`)
					}

					return !primitive ? `java.lang.Boolean.valueOf(${value})` : `${value}`
				case 'object':
					if (typeof value === 'string') {
						if (value) {
							return value
						} else {
							return 'null'
						}
					} else {
						context.log(CodegenLogLevel.WARN, `Literal is unsupported for schema type object: ${debugStringify(value)}`)
						return 'null'
					}
					break
				case 'file':
					throw new Error(`Cannot format literal for type ${type}`)
				case 'array': {
					const arrayValue = Array.isArray(value) ? value : [value]
					const component = options.component
					if (!component) {
						throw new Error(`toLiteral cannot format array literal without a component type: ${value}`)
					}
					return `java.util.Arrays.asList(${arrayValue.map(v => context.generator().toLiteral(v, { ...component.schema, ...component })).join(', ')})`
				}
			}
	
			throw new Error(`Unsupported literal type name "${type}" in options: ${debugStringify(options)}`)
		},
		toNativeType: (options) => {
			const { format, schemaType, vendorExtensions } = options

			/* Note that we return separate componentTypes in this function in case the type
			   is transformed, using nativeTypeTransformer, and the native type becomes primitive
			   as the component type must still be non-primitive.
			 */
			if (vendorExtensions && vendorExtensions['x-java-type']) {
				return new context.NativeType(String(vendorExtensions['x-java-type']))
			}
			
			/* See https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#data-types */
			switch (schemaType) {
				case CodegenSchemaType.INTEGER: {
					if (format === 'int32' || !format) {
						return new context.NativeType('java.lang.Integer')
					} else if (format === 'int64') {
						return new context.NativeType('java.lang.Long')
					} else {
						throw new Error(`Unsupported integer format: ${format}`)
					}
				}
				case CodegenSchemaType.NUMBER: {
					if (!format) {
						return new context.NativeType('java.math.BigDecimal')
					} else if (format === 'float') {
						return new context.NativeType('java.lang.Float')
					} else if (format === 'double') {
						return new context.NativeType('java.lang.Double')
					} else {
						throw new Error(`Unsupported number format: ${format}`)
					}
				}
				case CodegenSchemaType.DATE:
					return new context.NativeType(generatorOptions.dateImplementation, {
						serializedType: 'java.lang.String',
					})
				case CodegenSchemaType.TIME:
					return new context.NativeType(generatorOptions.timeImplementation, {
						serializedType: 'java.lang.String',
					})
				case CodegenSchemaType.DATETIME:
					return new context.NativeType(generatorOptions.dateTimeImplementation, {
						serializedType: 'java.lang.String',
					})
				case CodegenSchemaType.STRING: {
					if (format === 'byte') {
						/* base64 encoded characters */
						return new context.NativeType('java.lang.String')
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
				case CodegenSchemaType.BOOLEAN: {
					return new context.NativeType('java.lang.Boolean')
				}
				case CodegenSchemaType.BINARY: {
					return new context.NativeType(generatorOptions.binaryRepresentation)
				}
			}
	
			throw new Error(`Unsupported schema type: ${schemaType}`)
		},
		toNativeObjectType: function(options) {
			const { scopedName } = options
			let modelName = `${generatorOptions.modelPackage}`
			for (const name of scopedName) {
				modelName += `.${context.generator().toClassName(name)}`
			}
			return new context.NativeType(modelName)
		},
		toNativeArrayType: (options) => {
			const { componentNativeType, uniqueItems } = options
			if (uniqueItems) {
				return new context.TransformingNativeType(componentNativeType, {
					default: (nativeType) => `java.util.List<${(nativeType.componentType || nativeType).nativeType}>`,
					literalType: () => 'java.util.List',
					concreteType: (nativeType) => `java.util.ArrayList<${(nativeType.componentType || nativeType).nativeType}>`,
				})
			} else {
				return new context.TransformingNativeType(componentNativeType, {
					default: (nativeType) => `java.util.List<${(nativeType.componentType || nativeType).nativeType}>`,
					literalType: () => 'java.util.List',
					concreteType: (nativeType) => `java.util.ArrayList<${(nativeType.componentType || nativeType).nativeType}>`,
				})
			}
		},
		toNativeMapType: (options) => {
			const { keyNativeType, componentNativeType } = options
			return new context.ComposingNativeType([keyNativeType, componentNativeType], {
				default: ([keyNativeType, componentNativeType]) => `java.util.Map<${(keyNativeType.componentType || keyNativeType).nativeType}, ${(componentNativeType.componentType || componentNativeType).nativeType}>`,
				literalType: () => 'java.util.Map',
				concreteType: ([keyNativeType, componentNativeType]) => `java.util.HashMap<${(keyNativeType.componentType || keyNativeType).nativeType}, ${(componentNativeType.componentType || componentNativeType).nativeType}>`,
			})
		},
		nativeTypeUsageTransformer: ({ required, nullable }) => ({
			nativeType: function(nativeType, nativeTypeString) {
				const primitive = required && !nullable
				if (primitive) {
					if (nativeTypeString === 'java.lang.Integer') {
						return 'int'
					} else if (nativeTypeString === 'java.lang.Boolean') {
						return 'boolean'
					} else if (nativeTypeString === 'java.lang.Long') {
						return 'long'
					} else if (nativeTypeString === 'java.lang.Float') {
						return 'float'
					} else if (nativeTypeString === 'java.lang.Double') {
						return 'double'
					} else if (nativeTypeString === 'java.lang.Byte') {
						return 'byte'
					}
				}
				return nativeTypeString
			},
			componentType: {
				default: function(nativeType, nativeTypeString) {
					/* Return the original type so none of our transformations above apply to the type when used as a component.
					   Particularly, we mustn't use our primitive transformations as primitives can't be components, e.g. java.util.List<int>
					 */
					return nativeTypeString
				},
			},
		}),
		defaultValue: (options) => {
			const { schemaType } = options
	
			switch (schemaType) {
				case CodegenSchemaType.ENUM:
				case CodegenSchemaType.DATE:
				case CodegenSchemaType.TIME:
				case CodegenSchemaType.DATETIME:
				case CodegenSchemaType.BINARY:
				case CodegenSchemaType.OBJECT:
				case CodegenSchemaType.STRING:
				case CodegenSchemaType.ARRAY:
				case CodegenSchemaType.MAP:
				case CodegenSchemaType.INTERFACE:
					return { value: null, literalValue: 'null' }
				case CodegenSchemaType.NUMBER: {
					const literalValue = context.generator().toLiteral(0.0, options)
					if (literalValue === null) {
						return null
					}
					return { value: 0.0, literalValue }
				}
				case CodegenSchemaType.INTEGER: {
					const literalValue = context.generator().toLiteral(0, options)
					if (literalValue === null) {
						return null
					}
					return { value: 0, literalValue }
				}
				case CodegenSchemaType.BOOLEAN: {
					const literalValue = context.generator().toLiteral(false, options)
					if (literalValue === null) {
						return null
					}
					return { value: false, literalValue }
				}
			}
	
			throw new Error(`Unsupported default value type: ${schemaType}`)
		},

		initialValue: (options) => {
			const { required, schemaType, nativeType, defaultValue } = options

			/*
			  Default values in the spec are intended to be applied when a client or server receives a
			  response or request, respectively, and values are missing.

			  This implementation means that properties with defaults will get those default values as
			  their initial value, meaning that any properties that are omitted in the _received_ request or
			  response will have the default value.

			  TODO But it also means that any requests or responses _sent_ will _also_ have the default values,
			  rather than omitting the property and letting the receiving side apply the default value. This
			  is NOT according to the spec and should be fixed.
			 */
			if (defaultValue) {
				return defaultValue
			}
	
			if (!required) {
				return null
			}
	
			/*
			  We create empty collections for required properties in the Java code. This is because we generate
			  convenience methods for collections that initialise the collection when adding the first element,
			  which would mean if we didn't initialise required collection properties we might end up sending
			  a null collection value if the code didn't _add_ any elements. This would then require
			  explicitly initialising each required collection in user code, either every time, or whenever
			  no elements are added to it.
			  
			  Therfore we are not able to detect whether the user code has forgotten to populate the collection, like
			  we are with scalar required properties, so we populate it with an empty collection so we always generate
			  a valid result.
			 */
			switch (schemaType) {
				case CodegenSchemaType.ARRAY:
					/* Initialise required array properties with an empty array */
					return { value: [], literalValue: `new ${nativeType.concreteType}()` }
				case CodegenSchemaType.MAP:
					/* Initialise empty map properties with an empty map */
					return { value: {}, literalValue: `new ${nativeType.concreteType}()` }
				default:
					return null
			}
		},
		
		operationGroupingStrategy: () => {
			return context.operationGroupingStrategies.addToGroupsByTagOrPath
		},

		allOfStrategy: () => CodegenAllOfStrategy.OBJECT,
		anyOfStrategy: () => CodegenAnyOfStrategy.OBJECT,
		oneOfStrategy: () => CodegenOneOfStrategy.INTERFACE,
		supportsInheritance: () => true,
		supportsMultipleInheritance: () => false,
		nativeCompositionCanBeScope: () => false,
		nativeComposedSchemaRequiresName: () => false,
		nativeComposedSchemaRequiresObjectLikeOrWrapper: () => false,
		interfaceCanBeNested: () => true,
	
		watchPaths: () => {
			const result = [path.resolve(__dirname, '..', 'templates')]
			if (context.additionalWatchPaths) {
				result.push(...context.additionalWatchPaths())
			}
			if (generatorOptions.customTemplatesPath) {
				result.push(generatorOptions.customTemplatesPath)
			}
			return result
		},
	
		cleanPathPatterns: () => {
			const relativeSourceOutputPath = generatorOptions.relativeSourceOutputPath
			
			const apiPackagePath = packageToPath(generatorOptions.apiPackage)
			const apiImplPackagePath = packageToPath(generatorOptions.apiImplPackage)
			const modelPackagePath = packageToPath(generatorOptions.modelPackage)
			const validationPackagePath = packageToPath(generatorOptions.validationPackage)
	
			const result = [
				path.join(relativeSourceOutputPath, apiPackagePath, '*Api.java'),
				path.join(relativeSourceOutputPath, apiImplPackagePath, '*ApiImpl.java'),
				path.join(relativeSourceOutputPath, modelPackagePath, '*.java'),
				path.join(relativeSourceOutputPath, validationPackagePath, 'Request.java'),
				path.join(relativeSourceOutputPath, validationPackagePath, 'Response.java'),
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

			hbs.registerHelper('getter', function(property: CodegenProperty) {
				if (property.schema.schemaType === CodegenSchemaType.BOOLEAN && property.required && !property.nullable) {
					return `is${capitalize(context.generator().toIdentifier(property.name))}`
				} else {
					return `get${capitalize(context.generator().toIdentifier(property.name))}`
				}
			})
			hbs.registerHelper('setter', function(property: CodegenProperty) {
				return `set${capitalize(context.generator().toIdentifier(property.name))}`
			})
			hbs.registerHelper('escapeString', function(value: string) {
				// eslint-disable-next-line prefer-rest-params
				const options = arguments[arguments.length - 1] as ActualHelperOptions
				try {
					return escapeString(value)
				} catch (error) {
					throw new Error(`${error instanceof Error ? error.message : error} @ ${sourcePosition(options)}`)
				}
			})
			hbs.registerHelper('javax', function() {
				if (generatorOptions.useJakarta) {
					return 'jakarta'
				} else {
					return 'javax'
				}
			})
	
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
			for (const schema of context.utils.values(doc.schemas)) {
				if (isCodegenObjectSchema(schema)) {
					await emit('pojo', path.join(outputPath, relativeSourceOutputPath, modelPackagePath, `${context.generator().toClassName(schema.name)}.java`), 
						{ ...rootContext, pojo: schema }, true, hbs)
				} else if (isCodegenEnumSchema(schema)) {
					await emit('enum', path.join(outputPath, relativeSourceOutputPath, modelPackagePath, `${context.generator().toClassName(schema.name)}.java`), 
						{ ...rootContext, enum: schema }, true, hbs)
				} else if (isCodegenInterfaceSchema(schema)) {
					await emit('interface', path.join(outputPath, relativeSourceOutputPath, modelPackagePath, `${context.generator().toClassName(schema.name)}.java`), 
						{ ...rootContext, interface: schema }, true, hbs)
				} else if (isCodegenWrapperSchema(schema)) {
					await emit('wrapper', path.join(outputPath, relativeSourceOutputPath, modelPackagePath, `${context.generator().toClassName(schema.name)}.java`), 
						{ ...rootContext, schema }, true, hbs)
				}
			}

			if (generatorOptions.useBeanValidation) {
				const validationPackagePath = packageToPath(generatorOptions.validationPackage)
				await emit('validation/Request', path.join(outputPath, relativeSourceOutputPath, validationPackagePath, 'Request.java'), rootContext, true, hbs)
				await emit('validation/Response', path.join(outputPath, relativeSourceOutputPath, validationPackagePath, 'Response.java'), rootContext, true, hbs)
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

		postProcessDocument: (doc) => {
			for (const group of doc.groups) {
				for (const op of group.operations) {
					/* Fix form post request bodies, as we can't properly handle them using 
					   https://docs.oracle.com/javaee/7/api/javax/ws/rs/BeanParam.html yet
					 */
					if (op.requestBody && op.consumes && op.consumes[0].mimeType === 'application/x-www-form-urlencoded') {
						op.requestBody.nativeType = context.formUrlEncodedImplementation
							? context.formUrlEncodedImplementation()
							: new context.NativeType(`${generatorOptions.useJakarta ? 'jakarta' : 'javax'}.ws.rs.core.MultivaluedHashMap<java.lang.String, java.lang.String>`)
					}
				}
			}
		},

		checkPropertyCompatibility: (parentProp, childProp) => {
			if (!baseGenerator.checkPropertyCompatibility(parentProp, childProp)) {
				return false
			}

			/* Because in Java we use a java.util.Optional if a property is nullable, properties are not compatible
			   if their nullability varies.
			 */
			if (!parentProp.nullable !== !childProp.nullable) {
				return false
			}
			return true
		},
	}
}
