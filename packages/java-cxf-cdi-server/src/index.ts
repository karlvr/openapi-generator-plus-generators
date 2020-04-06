import { CodegenArrayTypePurpose, CodegenRootContext, CodegenMapTypePurpose, CodegenOperation, CodegenModel, CodegenPropertyType, CodegenConfig, CodegenGeneratorConstructor } from '@openapi-generator-plus/types'
import { constantCase } from 'change-case'
import { CodegenOptionsJava, ConstantStyle } from './types'
import path from 'path'
import Handlebars from 'handlebars'
import { loadTemplates, emit, registerStandardHelpers } from '@openapi-generator-plus/handlebars-templates'
import { identifierCamelCase, javaLikeGenerator } from '@openapi-generator-plus/java-like-generator-helper'
import { apiBasePath, commonGenerator, GroupingStrategies } from '@openapi-generator-plus/generator-common'

function escapeString(value: string) {
	value = value.replace(/\\/g, '\\\\')
	value = value.replace(/"/g, '\\"')
	value = value.replace(/\n/g, '\\n')
	return value
}

/**
 * Turns a Java package name into a path
 * @param packageName Java package name
 */
function packageToPath(packageName: string) {
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
	const defaultRelativeSourceOutputPath = maven ? 'src/main/java/' : ''
	
	let relativeSourceOutputPath: string = config.relativeSourceOutputPath !== undefined ? config.relativeSourceOutputPath : defaultRelativeSourceOutputPath
	if (relativeSourceOutputPath.length && !relativeSourceOutputPath.endsWith('/')) {
		relativeSourceOutputPath += '/'
	}

	return relativeSourceOutputPath
}

export const createGenerator: CodegenGeneratorConstructor<CodegenOptionsJava> = (generatorOptions) => ({
	...generatorOptions.baseGenerator(),
	...commonGenerator(),
	...javaLikeGenerator(),
	toConstantName: (name, state) => {
		const constantStyle = state.options.constantStyle
		switch (constantStyle) {
			case ConstantStyle.allCaps:
				return constantCase(name).replace(/_/g, '')
			case ConstantStyle.camelCase:
				return identifierCamelCase(name)
			case ConstantStyle.allCapsSnake:
				return constantCase(name)
			default:
				throw new Error(`Invalid valid for constantStyle: ${constantStyle}`)
		}
	},
	toLiteral: (value, options, state) => {
		if (value === undefined) {
			return state.generator.toDefaultValue(undefined, options, state)
		}

		const { type, format, required, propertyType } = options

		if (propertyType === CodegenPropertyType.ENUM) {
			return `${options.nativeType.toString()}.${state.generator.toEnumMemberName(value, state)}`
		}

		switch (type) {
			case 'integer': {
				if (format === 'int32' || format === undefined) {
					return !required ? `java.lang.Integer.valueOf(${value})` : `${value}`
				} else if (format === 'int64') {
					return !required ? `java.lang.Long.valueOf(${value}l)` : `${value}l`
				} else {
					throw new Error(`Unsupported ${type} format: ${format}`)
				}
			}
			case 'number': {
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
					return new generatorOptions.NativeType(!required ? 'java.lang.Integer' : 'int', {
						componentType: 'java.lang.Integer',
					})
				} else if (format === 'int64') {
					return new generatorOptions.NativeType(!required ? 'java.lang.Long' : 'long', {
						componentType: 'java.lang.Long',
					})
				} else {
					throw new Error(`Unsupported ${type} format: ${format}`)
				}
			}
			case 'number': {
				if (format === undefined) {
					return new generatorOptions.NativeType('java.math.BigDecimal')
				} else if (format === 'float') {
					return new generatorOptions.NativeType(!required ? 'java.lang.Float' : 'float', {
						componentType: 'java.lang.Float',
					})
				} else if (format === 'double') {
					return new generatorOptions.NativeType(!required ? 'java.lang.Double' : 'double', {
						componentType: 'java.lang.Double',
					})
				} else {
					throw new Error(`Unsupported ${type} format: ${format}`)
				}
			}
			case 'string': {
				if (format === 'byte') {
					return new generatorOptions.NativeType(!required ? 'java.lang.Byte' : 'byte', {
						componentType: 'java.lang.Byte',
						wireType: 'java.lang.String',
					})
				} else if (format === 'binary') {
					return new generatorOptions.NativeType('java.lang.String')
				} else if (format === 'date') {
					return new generatorOptions.NativeType(state.options.dateImplementation, {
						wireType: 'java.lang.String',
					})
				} else if (format === 'time') {
					return new generatorOptions.NativeType(state.options.timeImplementation, {
						wireType: 'java.lang.String',
					})
				} else if (format === 'date-time') {
					return new generatorOptions.NativeType(state.options.dateTimeImplementation, {
						wireType: 'java.lang.String',
					})
				} else if (format === 'uuid') {
					return new generatorOptions.NativeType('java.util.UUID', {
						wireType: 'java.lang.String',
					})
				} else if (format === 'url') {
					return new generatorOptions.NativeType('java.net.URL', {
						wireType: 'java.lang.String',
					})
				} else {
					return new generatorOptions.NativeType('java.lang.String')
				}
			}
			case 'boolean': {
				return new generatorOptions.NativeType(!required ? 'java.lang.Boolean' : 'boolean', {
					componentType: 'java.lang.Boolean',
				})
			}
			case 'file': {
				return new generatorOptions.NativeType('java.io.InputStream')
			}
		}

		throw new Error(`Unsupported type name: ${type}`)
	},
	toNativeObjectType: function({ modelNames }, state) {
		let modelName = `${state.options.modelPackage}`
		for (const name of modelNames) {
			modelName += `.${state.generator.toClassName(name, state)}`
		}
		return new generatorOptions.NativeType(modelName)
	},
	toNativeArrayType: ({ componentNativeType, uniqueItems, purpose }) => {
		if (purpose === CodegenArrayTypePurpose.PARENT) {
			/* We don't support array types as superclasses as we don't use model names for our non-parent type */
			const error = new generatorOptions.InvalidModelError('Array types are not supported as superclasses')
			error.name = 'InvalidModelError'
			throw error
		}

		if (uniqueItems) {
			// TODO should we use a LinkedHashSet here
			return new generatorOptions.NativeType(`java.util.List<${componentNativeType.componentType}>`, {
				wireType: `java.util.List<${componentNativeType.componentWireType}>`,
				literalType: 'java.util.List',
				concreteType: `java.util.ArrayList<${componentNativeType.componentType}>`,
			})
		} else {
			return new generatorOptions.NativeType(`java.util.List<${componentNativeType.componentType}>`, {
				wireType: `java.util.List<${componentNativeType.componentWireType}>`, 
				literalType: 'java.util.List',
				concreteType: `java.util.ArrayList<${componentNativeType.componentType}>`,
			})
		}
	},
	toNativeMapType: ({ keyNativeType, componentNativeType, purpose }) => {
		if (purpose === CodegenMapTypePurpose.PARENT) {
			const error = new generatorOptions.InvalidModelError('Map types are not supported as superclasses')
			error.name = 'InvalidModelError'
			throw error
		}
		return new generatorOptions.NativeType(`java.util.Map<${keyNativeType.componentType}, ${componentNativeType.componentType}>`, {
			wireType: `java.util.Map<${keyNativeType.componentWireType}, ${componentNativeType.componentWireType}>`,
			literalType: 'java.util.Map',
			concreteType: `java.util.HashMap<${keyNativeType.componentType}, ${componentNativeType.componentType}>`,
		})
	},
	toDefaultValue: (defaultValue, options, state) => {
		if (defaultValue !== undefined) {
			return state.generator.toLiteral(defaultValue, options, state)
		}

		const { type, required, propertyType, nativeType } = options

		if (!required) {
			return 'null'
		}

		switch (propertyType) {
			case CodegenPropertyType.ENUM:
				return 'null'
			case CodegenPropertyType.OBJECT:
				return 'null'
			case CodegenPropertyType.ARRAY:
			case CodegenPropertyType.MAP:
				return `new ${nativeType.concreteType}()`
			case CodegenPropertyType.NUMBER:
				return state.generator.toLiteral(0, options, state)
			case CodegenPropertyType.BOOLEAN:
				return state.generator.toLiteral(false, options, state)
			case CodegenPropertyType.DATE:
			case CodegenPropertyType.TIME:
			case CodegenPropertyType.DATETIME:
				return 'null'
			case CodegenPropertyType.FILE:
				return 'null'
			case CodegenPropertyType.STRING:
				return 'null'
		}

		throw new Error(`Unsupported type name: ${type}`)
	},
	options: (config): CodegenOptionsJava => {
		const packageName = config.package || 'com.example'
		return {
			apiPackage: config.apiPackage || `${packageName}`,
			apiServiceImplPackage: config.apiServiceImplPackage || `${config.apiPackage || packageName}.impl`,
			modelPackage: config.modelPackage || `${packageName}.model`,
			invokerPackage: config.invokerPackage || `${packageName}.app`,
			useBeanValidation: config.useBeanValidation !== undefined ? config.useBeanValidation : true,
			dateImplementation: config.dateImplementation || 'java.time.LocalDate',
			timeImplementation: config.timeImplementation || 'java.time.LocalTime',
			dateTimeImplementation: config.dateTimeImplementation || 'java.time.OffsetDateTime',
			constantStyle: config.constantStyle || ConstantStyle.allCapsSnake,
			hideGenerationTimestamp: config.hideGenerationTimestamp !== undefined ? config.hideGenerationTimestamp : false,
			authenticatedOperationAnnotation: config.authenticatedOperationAnnotation,
			imports: config.imports,
			maven: config.maven && {
				groupId: config.maven.groupId || 'com.example',
				artifactId: config.maven.artifactId || 'api-server',
				version: config.maven.version || '0.0.1',
			},
			relativeSourceOutputPath: computeRelativeSourceOutputPath(config),
			customTemplatesPath: config.customTemplates && computeCustomTemplatesPath(config.configPath, config.customTemplates),
		}
	},
	operationGroupingStrategy: () => {
		return GroupingStrategies.addToGroupsByPath
	},

	watchPaths: (config) => {
		const result = [path.resolve(__dirname, '../templates')]
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
			`${relativeSourceOutputPath}${apiPackagePath}/*Api.java`,
			`${relativeSourceOutputPath}${modelPackagePath}/*.java`,
		]
	},

	exportTemplates: async(outputPath, doc, state) => {
		const hbs = Handlebars.create()
		
		registerStandardHelpers(hbs, generatorOptions, state)

		await loadTemplates(path.resolve(__dirname, '../templates'), hbs)

		if (state.options.customTemplatesPath) {
			await loadTemplates(state.options.customTemplatesPath, hbs)
		}

		const rootContext: CodegenRootContext = {
			generatorClass: '@openapi-generator-plus/java-cxf-cdi-server',
			generatedDate: new Date().toISOString(),
		}

		if (!outputPath.endsWith('/')) {
			outputPath += '/'
		}

		const relativeSourceOutputPath = state.options.relativeSourceOutputPath

		const apiPackagePath = packageToPath(state.options.apiPackage)
		for (const group of doc.groups) {
			const operations = group.operations.filter(shouldGenerateOperation)
			if (!operations.length) {
				continue
			}
			await emit('api', `${outputPath}${relativeSourceOutputPath}${apiPackagePath}/${state.generator.toClassName(group.name, state)}Api.java`, 
				{ ...group, operations, ...state.options, ...rootContext }, true, hbs)
		}

		for (const group of doc.groups) {
			const operations = group.operations.filter(shouldGenerateOperation)
			if (!operations.length) {
				continue
			}
			await emit('apiService', `${outputPath}${relativeSourceOutputPath}${apiPackagePath}/${state.generator.toClassName(group.name, state)}ApiService.java`, 
				{ ...group, operations, ...state.options, ...rootContext }, true, hbs)
		}

		const apiImplPackagePath = packageToPath(state.options.apiServiceImplPackage)
		for (const group of doc.groups) {
			const operations = group.operations.filter(shouldGenerateOperation)
			if (!operations.length) {
				continue
			}
			await emit('apiServiceImpl', `${outputPath}${relativeSourceOutputPath}${apiImplPackagePath}/${state.generator.toClassName(group.name, state)}ApiServiceImpl.java`, 
				{ ...group, ...state.options, ...rootContext }, false, hbs)
		}

		const modelPackagePath = packageToPath(state.options.modelPackage)
		for (const model of doc.models) {
			if (!shouldGenerateModel(model)) {
				continue
			}
			const context = {
				models: [model],
			}
			await emit('model', `${outputPath}${relativeSourceOutputPath}${modelPackagePath}/${state.generator.toClassName(model.name, state)}.java`, 
				{ ...context, ...state.options, ...rootContext }, true, hbs)
		}

		const invokerPackagePath = packageToPath(state.options.invokerPackage)
		if (invokerPackagePath) {
			const basePath = apiBasePath(doc.servers)
			await emit('invoker', `${outputPath}${relativeSourceOutputPath}${invokerPackagePath}/RestApplication.java`, 
				{ ...doc.info, ...state.options, ...rootContext, basePath }, false, hbs)
		}

		const maven = state.options.maven
		if (maven) {
			await emit('pom', `${outputPath}pom.xml`, { ...maven, ...state.options, ...rootContext }, false, hbs)
		}
	},
})

function shouldGenerateOperation(op: CodegenOperation) {
	return !(op.vendorExtensions && op.vendorExtensions['x-no-server'])
}

function shouldGenerateModel(model: CodegenModel) {
	return !(model.vendorExtensions && model.vendorExtensions['x-no-server'])
}

export default createGenerator
