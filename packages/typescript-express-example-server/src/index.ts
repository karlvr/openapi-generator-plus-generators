import { CodegenRootContext, CodegenMapTypePurpose, CodegenArrayTypePurpose, CodegenGeneratorConstructor } from '@openapi-generator-plus/types'
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

export const createGenerator: CodegenGeneratorConstructor<CodegenOptionsTypescript> = (generatorOptions) => ({
	...generatorOptions.baseGenerator(),
	...commonGenerator(),
	...javaLikeGenerator(),
	toConstantName: (name) => {
		return pascalCase(name)
	},
	toLiteral: (value, options, state) => {
		if (value === undefined) {
			return state.generator.toDefaultValue(undefined, options, state)
		}

		const { type, format, required } = options
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
				return new generatorOptions.NativeType('number')
			}
			case 'number': {
				return new generatorOptions.NativeType('number')
			}
			case 'string': {
				switch (format) {
					case 'date':
					case 'time':
					case 'date-time':
						/* We don't have a mapping library to convert incoming and outgoing JSON, so the rawType of dates is string */
						return new generatorOptions.NativeType('Date', {
							wireType: 'string',
						})
					default:
						return new generatorOptions.NativeType('string')
				}
			}
			case 'boolean': {
				return new generatorOptions.NativeType('boolean')
			}
			case 'file': {
				/* JavaScript does have a File type, but it isn't supported by JSON serialization so we don't have a wireType */
				return new generatorOptions.NativeType('File', {
					wireType: null,
				})
			}
		}

		throw new Error(`Unsupported type name: ${type}`)
	},
	toNativeObjectType: function({ modelNames }, state) {
		let modelName = ''
		for (const name of modelNames) {
			modelName += `.${state.generator.toClassName(name, state)}`
		}
		return new generatorOptions.NativeType(modelName.substring(1))
	},
	toNativeArrayType: ({ componentNativeType, purpose }) => {
		if (purpose === CodegenArrayTypePurpose.PARENT) {
			throw new generatorOptions.InvalidModelError()
		}
		return new generatorOptions.NativeType(`${componentNativeType}[]`, {
			wireType: `${componentNativeType.wireType}[]`,
		})
	},
	toNativeMapType: ({ keyNativeType, componentNativeType, purpose }) => {
		if (purpose === CodegenMapTypePurpose.PARENT) {
			throw new generatorOptions.InvalidModelError()
		}
		return new generatorOptions.NativeType(`{ [name: ${keyNativeType}]: ${componentNativeType} }`, {
			wireType: `{ [name: ${keyNativeType.wireType}]: ${componentNativeType.wireType} }`,
		})
	},
	toDefaultValue: (defaultValue, options, state) => {
		if (defaultValue !== undefined) {
			return state.generator.toLiteral(defaultValue, options, state)
		}

		const { type, required } = options
		if (!required) {
			return 'undefined'
		}

		switch (type) {
			case 'integer':
			case 'number':
				return state.generator.toLiteral(0, options, state)
			case 'boolean':
				return 'false'
			case 'string':
			case 'object':
			case 'array':
			case 'file':
				return 'undefined'
		}

		throw new Error(`Unsupported type name: ${type}`)
	},
	options: (config): CodegenOptionsTypescript => {
		const npm = config.npm
		const defaultRelativeSourceOutputPath = npm ? 'src/' : ''
		
		let relativeSourceOutputPath: string = config.relativeSourceOutputPath !== undefined ? config.relativeSourceOutputPath : defaultRelativeSourceOutputPath
		if (relativeSourceOutputPath.length && !relativeSourceOutputPath.endsWith('/')) {
			relativeSourceOutputPath += '/'
		}

		const npmConfig: NpmOptions | undefined = npm ? {
			name: npm.name || 'typescript-express-example-server',
			version: npm.version || '0.0.1',
			repository: npm.repository,
		} : undefined

		const typescriptOptions: TypeScriptOptions | undefined = config.typescript ? {
			target: config.typescript.target || 'ES2015',
			libs: config.typescript.libs || [config.typescript.target || 'ES2015', 'DOM'],
		} : undefined

		return {
			relativeSourceOutputPath,
			npm: npmConfig,
			typescript: typescriptOptions,
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

	cleanPathPatterns: () => undefined,

	exportTemplates: async(outputPath, doc, state) => {
		const hbs = Handlebars.create()

		registerStandardHelpers(hbs, generatorOptions, state)

		/* Convert an operation path to an express path */
		hbs.registerHelper('expressPath', function(path: string) {
			if (!path) {
				return path
			}

			return path.replace(/\{([-a-zA-Z_]+)\}/g, ':$1')
		})

		await loadTemplates(path.resolve(__dirname, '../templates'), hbs)

		if (state.options.customTemplatesPath) {
			await loadTemplates(state.options.customTemplatesPath, hbs)
		}

		const rootContext: CodegenRootContext = {
			generatorClass: '@openapi-generator-plus/typescript-node-express-server-generator',
			generatedDate: new Date().toISOString(),
		}

		if (!outputPath.endsWith('/')) {
			outputPath += '/'
		}

		const relativeSourceOutputPath = state.options.relativeSourceOutputPath

		await emit('index', `${outputPath}${relativeSourceOutputPath}index.ts`, { ...doc, ...state.options, ...rootContext }, true, hbs)
		if (state.options.npm) {
			await emit('package', `${outputPath}package.json`, { ...state.options.npm, ...state.options, ...rootContext }, true, hbs)
		}
		if (state.options.typescript) {
			await emit('tsconfig', `${outputPath}tsconfig.json`, { ...state.options.typescript, ...state.options, ...rootContext }, true, hbs)
		}
		await emit('gitignore', `${outputPath}.gitignore`, { ...doc, ...state.options, ...rootContext }, true, hbs)
	},
})

export default createGenerator
