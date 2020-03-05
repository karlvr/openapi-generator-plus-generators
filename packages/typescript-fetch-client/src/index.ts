import { pascalCase, camelCase, capitalize, GroupingStrategies, CodegenRootContext, CodegenGenerator, CodegenNativeType, InvalidModelError, CodegenMapTypePurpose, CodegenArrayTypePurpose } from '@openapi-generator-plus/core'
import { CodegenOptionsTypescript } from './types'
import path from 'path'
import Handlebars, { HelperOptions } from 'handlebars'
import { promises as fs } from 'fs'
import pluralize from 'pluralize'

async function compileTemplate(templatePath: string, hbs: typeof Handlebars) {
	const templateSource = await fs.readFile(templatePath, 'UTF-8')
	return hbs.compile(templateSource)
}

async function loadTemplates(templateDirPath: string, hbs: typeof Handlebars) {
	const files = await fs.readdir(templateDirPath)
	
	for (const file of files) {
		const template = await compileTemplate(path.resolve(templateDirPath, file), hbs)
		hbs.registerPartial(path.parse(file).name, template)
	}
}

/** Returns the string converted to a string that is safe as an identifier in most languages */
function identifierSafe(value: string) {
	/* Remove invalid leading characters */
	value = value.replace(/^[^a-zA-Z_]*/, '')

	/* Convert any illegal characters to underscores */
	value = value.replace(/[^a-zA-Z0-9_]/g, '_')

	return value
}

/**
 * Camel case and capitalize suitable for a class name. Doesn't change existing
 * capitalization in the value.
 * e.g. "FAQSection" remains "FAQSection", and "faqSection" will become "FaqSection" 
 * @param value string to be turned into a class name
 */
function classCamelCase(value: string) {
	return pascalCase(identifierSafe(value))
}

function identifierCamelCase(value: string) {
	return camelCase(identifierSafe(value))
}

function escapeString(value: string) {
	value = value.replace(/\\/g, '\\\\')
	value = value.replace(/'/g, '\\\'')
	return value
}

async function emit(templateName: string, outputPath: string, context: object, replace: boolean, hbs: typeof Handlebars) {
	const template = hbs.partials[templateName]
	if (!template) {
		throw new Error(`Unknown template: ${templateName}`)
	}

	let outputString
	try {
		outputString = template(context)
	} catch (error) {
		console.error(`Failed to generate template "${templateName}"`, error)
		return
	}

	if (outputPath === '-') {
		console.log(outputString)
	} else {
		if (!replace) {
			try {
				await fs.access(outputPath)
				/* File exists, don't replace */
				return
			} catch (error) {
				/* Ignore, file doesn't exist */
			}
		}
		await fs.mkdir(path.dirname(outputPath), { recursive: true })
		fs.writeFile(outputPath, outputString, 'UTF-8')
	}
}

const generator: CodegenGenerator = {
	toClassName: (name) => {
		return classCamelCase(name)
	},
	toIdentifier: (name) => {
		return identifierCamelCase(name)
	},
	toConstantName: (name) => {
		return pascalCase(name)
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
	toLiteral: (value, type, format, required, state) => {
		if (value === undefined) {
			return state.generator.toDefaultValue(undefined, type, format, required, state)
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
	toNativeType: ({ type, format, modelNames }, state) => {
		/* See https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#data-types */
		switch (type) {
			case 'integer': {
				return new CodegenNativeType('number')
			}
			case 'number': {
				return new CodegenNativeType('number')
			}
			case 'string': {
				switch (format) {
					case 'date':
					case 'time':
					case 'date-time':
						/* We don't have a mapping library to convert incoming and outgoing JSON, so the rawType of dates is string */
						return new CodegenNativeType('Date', 'string')
					default:
						return new CodegenNativeType('string')
				}
			}
			case 'boolean': {
				return new CodegenNativeType('boolean')
			}
			case 'object': {
				if (modelNames) {
					let modelName = ''
					for (const name of modelNames) {
						modelName += `.${state.generator.toClassName(name, state)}`
					}
					return new CodegenNativeType(modelName.substring(1))
				} else {
					return new CodegenNativeType('object')
				}
			}
			case 'file': {
				/* JavaScript does have a File type, but it isn't supported by JSON serialization so we don't have a wireType */
				return new CodegenNativeType('File', null)
			}
		}

		throw new Error(`Unsupported type name: ${type}`)
	},
	toNativeArrayType: ({ componentNativeType, purpose }) => {
		if (purpose === CodegenArrayTypePurpose.PARENT) {
			throw new InvalidModelError()
		}
		return new CodegenNativeType(`${componentNativeType}[]`, `${componentNativeType.wireType}[]`)
	},
	toNativeMapType: ({ keyNativeType, componentNativeType, purpose }) => {
		if (purpose === CodegenMapTypePurpose.PARENT) {
			throw new InvalidModelError()
		}
		return new CodegenNativeType(`{ [name: ${keyNativeType}]: ${componentNativeType} }`, `{ [name: ${keyNativeType.wireType}]: ${componentNativeType.wireType} }`)
	},
	toDefaultValue: (defaultValue, type, format, required, state) => {
		if (defaultValue !== undefined) {
			return state.generator.toLiteral(defaultValue, type, format, required, state)
		}

		if (!required) {
			return 'undefined'
		}

		switch (type) {
			case 'integer':
			case 'number':
				return state.generator.toLiteral(0, type, format, required, state)
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
		return {
			npmName: config.npmName,
			npmVersion: config.npmVersion,
			supportsES6: false,
			config,
		}
	},
	operationGroupingStrategy: () => {
		return GroupingStrategies.addToGroupsByTag
	},

	exportTemplates: async(doc, state) => {
		const hbs = Handlebars.create()
		const generator = state.generator

		/** Convert the string argument to a Java class name. */
		hbs.registerHelper('className', function(name: string) {
			if (typeof name === 'string') {
				return generator.toClassName(name, state)
			} else {
				throw new Error(`className helper has invalid name parameter: ${name}`)
			}
		})
		/** Convert the given name to be a safe appropriately named identifier for the language */
		hbs.registerHelper('identifier', function(name: string) {
			if (typeof name === 'string') {
				return generator.toIdentifier(name, state)
			} else {
				throw new Error(`identifier helper has invalid parameter: ${name}`)
			}
		})
		hbs.registerHelper('constantName', function(name: string) {
			if (typeof name === 'string') {
				return generator.toConstantName(name, state)
			} else {
				throw new Error(`constantName helper has invalid parameter: ${name}`)
			}
		})
		// Handlebars.registerHelper('literal', function(value: any) {
		// 	if (value !== undefined) {
		// 		return new Handlebars.SafeString(config.toLiteral(value, state))
		// 	} else {
		// 		throw new Error(`literal helper has invalid parameter: ${value}`)
		// 	}
		// })
		hbs.registerHelper('capitalize', function(value: string) {
			return capitalize(value)
		})
		hbs.registerHelper('escapeString', function(value: string) {
			return escapeString(value)
		})
		// Handlebars.registerHelper('hasConsumes', function(this: any, options: HelperOptions) {
		// 	if (this.consumes) {
		// 		return options.fn({
		// 			...this,
		// 			consumes: this.consumes.map((mediaType: string) => ({ mediaType })),
		// 		})
		// 	} else {
		// 		return options.inverse(this)
		// 	}
		// })
		// Handlebars.registerHelper('hasProduces', function(this: any, options: HelperOptions) {
		// 	if (this.produces) {
		// 		return options.fn({
		// 			...this,
		// 			produces: this.produces.map((mediaType: string) => ({ mediaType })),
		// 		})
		// 	} else {
		// 		return options.inverse(this)
		// 	}
		// })
		// Handlebars.registerHelper('subresourceOperation', function(this: any, options: HelperOptions) {
		// 	if (this.path) {
		// 		return options.fn(this)
		// 	} else {
		// 		return options.inverse(this)
		// 	}
		// })
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		hbs.registerHelper('hasMore', function(this: any, options: HelperOptions) {
			if (options.data.last === false) {
				return options.fn(this)
			} else {
				return options.inverse(this)
			}
		})
		// Handlebars.registerHelper('dataType', function(this: any, name: string) {
		// 	/* Convert the given swagger type to a type appropriate to the language */
		// 	if (this.type) {
		// 		return new Handlebars.SafeString(config.toDataType(this.type, this.format, this.required, this.refName))
		// 	}
		// })
		// Handlebars.registerHelper('returnBaseType', function(this: CodegenOperationDetail, options: HelperOptions) {
		// 	// console.log('returnBaseType', options)
		// 	if (this.responses) {

		// 	}
		// 	if (options.fn) {
		// 		/* Block helper */
		// 		return options.fn(this)
		// 	} else {
		// 		return 'OK'
		// 	}
		// })
		// Handlebars.registerHelper('httpMethod', function(this: any, options: HelperOptions) {
		// 	console.log('HTTP METHOD', this)
		// 	return this.method
		// })
		// Handlebars.registerHelper('helperMissing', function(this: any) {
		// 	const options = arguments[arguments.length - 1];

		hbs.registerHelper('safe', function(value: string) {
			return new Handlebars.SafeString(value)
		})

		await loadTemplates(path.resolve(__dirname, '../templates'), hbs)

		const rootContext: CodegenRootContext = {
			generatorClass: 'openapi-generator-node',
			generatedDate: new Date().toISOString(),
		}

		const outputPath = state.config.output
		const options = state.options as CodegenOptionsTypescript

		await emit('api', `${outputPath}/api.ts`, { ...doc, ...state.options, ...rootContext }, true, hbs)
		await emit('configuration', `${outputPath}/configuration.ts`, { ...doc, ...state.options, ...rootContext }, true, hbs)
		await emit('custom.d', `${outputPath}/custom.d.ts`, { ...doc, ...state.options, ...rootContext }, true, hbs)
		await emit('index', `${outputPath}/index.ts`, { ...doc, ...state.options, ...rootContext }, true, hbs)
		if (options.npmName) {
			await emit('package', `${outputPath}/package.json`, { ...doc, ...state.options, ...rootContext }, true, hbs)
		}
		await emit('README', `${outputPath}/README.md`, { ...doc, ...state.options, ...rootContext }, true, hbs)
		await emit('tsconfig', `${outputPath}/tsconfig.json`, { ...doc, ...state.options, ...rootContext }, true, hbs)
	},
}

export default generator
