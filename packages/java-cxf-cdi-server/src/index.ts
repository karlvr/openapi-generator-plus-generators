import { GroupingStrategies, CodegenGenerator, CodegenArrayTypePurpose, CodegenRootContext, CodegenMapTypePurpose, CodegenNativeType, InvalidModelError, CodegenOptions } from '@openapi-generator-plus/core'
import { constantCase } from 'change-case'
import { CodegenOptionsJava, ConstantStyle, MavenOptions } from './types'
import path from 'path'
import Handlebars from 'handlebars'
import * as _ from 'lodash'
import pluralize from 'pluralize'
import { loadTemplates, emit, registerStandardHelpers } from '@openapi-generator-plus/handlebars-templates'
import { classCamelCase, identifierCamelCase } from '@openapi-generator-plus/java-like-generator-helper'

function escapeString(value: string) {
	value = value.replace(/\\/g, '\\\\')
	value = value.replace(/"/g, '\\"')
	return value
}

/**
 * Turns a Java package name into a path
 * @param packageName Java package name
 */
function packageToPath(packageName: string) {
	return packageName.replace(/\./g, path.sep)
}

const generator: CodegenGenerator<CodegenOptionsJava> = {
	toClassName: (name) => {
		return classCamelCase(name)
	},
	toIdentifier: (name) => {
		return identifierCamelCase(name)
	},
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
	toEnumName: (name) => {
		return classCamelCase(name) + 'Enum'
	},
	toOperationName: (path, method) => {
		return `${method.toLocaleLowerCase()}_${path}`
	},
	toModelNameFromPropertyName: (name, state) => {
		return state.generator.toClassName(pluralize.singular(name), state)
	},
	toLiteral: (value, { type, format, required }, state) => {
		if (value === undefined) {
			return state.generator.toDefaultValue(undefined, { type, format, required }, state)
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
	toNativeType: ({ type, format, required, modelNames }, state) => {
		/* See https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#data-types */
		switch (type) {
			case 'integer': {
				if (format === 'int32' || format === undefined) {
					return new CodegenNativeType(!required ? 'java.lang.Integer' : 'int')
				} else if (format === 'int64') {
					return new CodegenNativeType(!required ? 'java.lang.Long' : 'long')
				} else {
					throw new Error(`Unsupported ${type} format: ${format}`)
				}
			}
			case 'number': {
				if (format === undefined) {
					return new CodegenNativeType('java.math.BigDecimal')
				} else if (format === 'float') {
					return new CodegenNativeType(!required ? 'java.lang.Float' : 'float')
				} else if (format === 'double') {
					return new CodegenNativeType(!required ? 'java.lang.Double' : 'double')
				} else {
					throw new Error(`Unsupported ${type} format: ${format}`)
				}
			}
			case 'string': {
				if (format === 'byte') {
					return new CodegenNativeType(!required ? 'java.lang.Byte' : 'byte')
				} else if (format === 'binary') {
					return new CodegenNativeType('java.lang.String')
				} else if (format === 'date') {
					return new CodegenNativeType(state.options.dateImplementation)
				} else if (format === 'time') {
					return new CodegenNativeType(state.options.timeImplementation)
				} else if (format === 'date-time') {
					return new CodegenNativeType(state.options.dateTimeImplementation)
				} else {
					return new CodegenNativeType('java.lang.String')
				}
			}
			case 'boolean': {
				return new CodegenNativeType(!required ? 'java.lang.Boolean' : 'boolean')
			}
			case 'object': {
				if (modelNames) {
					let modelName = `${state.options.modelPackage}`
					for (const name of modelNames) {
						modelName += `.${state.generator.toClassName(name, state)}`
					}
					return new CodegenNativeType(modelName)
				} else {
					return new CodegenNativeType('java.lang.Object')
				}
			}
			case 'file': {
				return new CodegenNativeType('java.io.InputStream')
			}
		}

		throw new Error(`Unsupported type name: ${type}`)
	},
	toNativeArrayType: ({ componentNativeType, uniqueItems, purpose }) => {
		if (purpose === CodegenArrayTypePurpose.PARENT) {
			/* We don't support array types as superclasses as we don't use model names for our non-parent type */
			const error = new InvalidModelError('Array types are not supported as superclasses')
			error.name = 'InvalidModelError'
			throw error
		}

		if (uniqueItems) {
			// TODO should we use a LinkedHashSet here
			return new CodegenNativeType(`java.util.List<${componentNativeType}>`, `java.util.List<${componentNativeType.wireType}>`, 'java.util.List')
		} else {
			return new CodegenNativeType(`java.util.List<${componentNativeType}>`, `java.util.List<${componentNativeType.wireType}>`, 'java.util.List')
		}
	},
	toNativeMapType: ({ keyNativeType, componentNativeType, purpose }) => {
		if (purpose === CodegenMapTypePurpose.PARENT) {
			const error = new InvalidModelError('Map types are not supported as superclasses')
			error.name = 'InvalidModelError'
			throw error
		}
		return new CodegenNativeType(`java.util.Map<${keyNativeType}, ${componentNativeType}>`, `java.util.Map<${keyNativeType.wireType}, ${componentNativeType.wireType}>`)
	},
	toDefaultValue: (defaultValue, { type, format, required }, state) => {
		if (defaultValue !== undefined) {
			return state.generator.toLiteral(defaultValue, { type, format, required }, state)
		}

		if (!required) {
			return 'null'
		}

		switch (type) {
			case 'integer':
			case 'number':
				return state.generator.toLiteral(0, { type, format, required }, state)
			case 'boolean':
				return 'false'
			case 'string':
			case 'object':
			case 'array':
			case 'file':
				return 'null'
		}

		throw new Error(`Unsupported type name: ${type}`)
	},
	options: (config) => {
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
			config,
		}
	},
	operationGroupingStrategy: () => {
		return GroupingStrategies.addToGroupsByPath
	},

	exportTemplates: async(doc, state) => {
		const hbs = Handlebars.create()
		
		registerStandardHelpers(hbs, state)

		await loadTemplates(path.resolve(__dirname, '../templates'), hbs)

		if (state.config.customTemplates) {
			const customTemplatesPath = state.config.configPath ? path.resolve(path.dirname(state.config.configPath), state.config.customTemplates) : state.config.customTemplates
			await loadTemplates(customTemplatesPath, hbs)
		}

		const rootContext: CodegenRootContext = {
			generatorClass: 'openapi-generator-plus/java-cxf-cdi-server',
			generatedDate: new Date().toISOString(),
		}

		let outputPath = state.config.outputPath
		if (!outputPath.endsWith('/')) {
			outputPath += '/'
		}

		const maven = state.config.maven
		const defaultRelativeSourceOutputPath = maven ? 'src/main/java/' : ''
		
		let relativeSourceOutputPath: string = state.config.relativeSourceOutputPath !== undefined ? state.config.relativeSourceOutputPath : defaultRelativeSourceOutputPath
		if (relativeSourceOutputPath.length && !relativeSourceOutputPath.endsWith('/')) {
			relativeSourceOutputPath += '/'
		}

		const apiPackagePath = packageToPath(state.options.apiPackage)
		for (const group of doc.groups) {
			await emit('api', `${outputPath}${relativeSourceOutputPath}${apiPackagePath}/${state.generator.toClassName(group.name, state)}Api.java`, { ...group, ...state.options, ...rootContext }, true, hbs)
		}

		for (const group of doc.groups) {
			await emit('apiService', `${outputPath}${relativeSourceOutputPath}${apiPackagePath}/${state.generator.toClassName(group.name, state)}ApiService.java`, { ...group, ...state.options, ...rootContext }, true, hbs)
		}

		const apiImplPackagePath = packageToPath(state.options.apiServiceImplPackage)
		for (const group of doc.groups) {
			await emit('apiServiceImpl', `${outputPath}${relativeSourceOutputPath}${apiImplPackagePath}/${state.generator.toClassName(group.name, state)}ApiServiceImpl.java`, 
				{ ...group, ...state.options, ...rootContext }, false, hbs)
		}

		const modelPackagePath = packageToPath(state.options.modelPackage)
		for (const model of doc.models) {
			const context = {
				models: [model],
			}
			await emit('model', `${outputPath}${relativeSourceOutputPath}${modelPackagePath}/${state.generator.toClassName(model.name, state)}.java`, { ...context, ...state.options, ...rootContext }, true, hbs)
		}

		if (maven) {
			const mavenConfig: MavenOptions = {
				groupId: maven.groupId || 'com.example',
				artifactId: maven.artifactId || 'api-server',
				version: maven.version || '0.0.1',
			}
			await emit('pom', `${outputPath}pom.xml`, { ...mavenConfig, ...state.options, ...rootContext }, false, hbs)
		}
	},
}

export default generator
