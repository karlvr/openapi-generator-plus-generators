import { CodegenRootContext, CodegenGeneratorConstructor, CodegenGeneratorType, CodegenPropertyType } from '@openapi-generator-plus/types'
import { CodegenOptionsTypescript, NpmOptions, TypeScriptOptions } from './types'
import path from 'path'
import Handlebars from 'handlebars'
import { loadTemplates, emit, registerStandardHelpers } from '@openapi-generator-plus/handlebars-templates'
import { javaLikeGenerator } from '@openapi-generator-plus/java-like-generator-helper'
import { commonGenerator, pascalCase } from '@openapi-generator-plus/generator-common'

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

export const createGenerator: CodegenGeneratorConstructor<CodegenOptionsTypescript> = (context) => ({
	...context.baseGenerator(),
	...commonGenerator(),
	...javaLikeGenerator(),
	generatorType: () => CodegenGeneratorType.SERVER,
	toConstantName: (name) => {
		return pascalCase(name)
	},
	toLiteral: (value, options, state) => {
		if (value === undefined) {
			return state.generator.toDefaultValue(undefined, options, state).literalValue
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
		let modelName = ''
		for (const name of modelNames) {
			modelName += `.${state.generator.toClassName(name, state)}`
		}
		return new context.NativeType(modelName.substring(1))
	},
	toNativeArrayType: ({ componentNativeType }) => {
		return new context.NativeType(`${componentNativeType}[]`, {
			wireType: `${componentNativeType.wireType}[]`,
		})
	},
	toNativeMapType: ({ keyNativeType, componentNativeType }) => {
		return new context.NativeType(`{ [name: ${keyNativeType}]: ${componentNativeType} }`, {
			wireType: `{ [name: ${keyNativeType.wireType}]: ${componentNativeType.wireType} }`,
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
		return context.operationGroupingStrategies.addToGroupsByPath
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

		/* Convert an operation path to an express path */
		hbs.registerHelper('expressPath', function(path: string) {
			if (!path) {
				return path
			}

			return path.replace(/\{([-a-zA-Z_]+)\}/g, ':$1')
		})

		await loadTemplates(path.resolve(__dirname, '..', 'templates'), hbs)

		if (state.options.customTemplatesPath) {
			await loadTemplates(state.options.customTemplatesPath, hbs)
		}

		const rootContext: CodegenRootContext = {
			generatorClass: '@openapi-generator-plus/typescript-node-express-server-generator',
			generatedDate: new Date().toISOString(),
		}

		const relativeSourceOutputPath = state.options.relativeSourceOutputPath

		await emit('index', path.join(outputPath, relativeSourceOutputPath, 'index.ts'), { ...doc, ...state.options, ...rootContext }, true, hbs)
		if (state.options.npm) {
			await emit('package', path.join(outputPath, 'package.json'), { ...state.options.npm, ...state.options, ...rootContext }, true, hbs)
		}
		if (state.options.typescript) {
			await emit('tsconfig', path.join(outputPath, 'tsconfig.json'), { ...state.options.typescript, ...state.options, ...rootContext }, true, hbs)
		}
		await emit('gitignore', path.join(outputPath, '.gitignore'), { ...doc, ...state.options, ...rootContext }, true, hbs)
	},
})

export default createGenerator
