import { promises as fs } from 'fs'
import path from 'path'
import Handlebars, { HelperOptions } from 'handlebars'
import { camelCase, capitalize, pascalCase, uniquePropertiesIncludingInherited } from '@openapi-generator-plus/generator-common'
import { CodegenGeneratorContext, CodegenTypeInfo, CodegenPropertyType, CodegenResponse, CodegenRequestBody, CodegenModel, CodegenOperation } from '@openapi-generator-plus/types'
import { snakeCase, constantCase, sentenceCase, capitalCase } from 'change-case'
import pluralize from 'pluralize'
import { idx } from '@openapi-generator-plus/core'
import marked from 'marked'

type UnknownObject = Record<string, unknown>

async function compileTemplate(templatePath: string, hbs: typeof Handlebars) {
	const templateSource = await fs.readFile(templatePath, { encoding: 'utf-8' })
	return hbs.compile(templateSource)
}

/**
 * Load all Handlebars (*.hbs) templates from the given directory as partials.
 * @param templateDirPath path to template dir
 * @param hbs Handlebars instance
 */
export async function loadTemplates(templateDirPath: string, hbs: typeof Handlebars, prefix = ''): Promise<void> {
	const files = await fs.readdir(templateDirPath)
	
	for (const file of files) {
		const resolvedFile = path.resolve(templateDirPath, file)
		const stat = await fs.stat(resolvedFile)
		if (stat.isDirectory()) {
			await loadTemplates(resolvedFile, hbs, `${prefix}${file}/`)
			continue
		}

		if (!file.endsWith('.hbs')) {
			continue
		}

		const template = await compileTemplate(resolvedFile, hbs)

		const baseName = path.parse(file).name
		const name = `${prefix}${baseName}`
		if (hbs.partials[name]) {
			/* If we will clobber an existing partial, prefix the original so we can still access it */
			hbs.registerPartial(`${prefix}original${capitalize(baseName)}`, hbs.partials[name])
		}
		hbs.registerPartial(name, template)
	}
}

/**
 * Emit a file
 * @param templateName The name of the template partial to use as the root of the output
 * @param outputPath The path of the file to output to
 * @param context The context object for the template to use
 * @param replace Whether to replace an existing file if one exists
 * @param hbs Handlebars instance
 */
export async function emit(templateName: string, outputPath: string, context: UnknownObject, replace: boolean, hbs: typeof Handlebars): Promise<void> {
	const template: Handlebars.TemplateDelegate = hbs.partials[templateName]
	if (!template) {
		throw new Error(`Unknown template: ${templateName}`)
	}

	let outputString
	try {
		outputString = template(context, {
			/* We use property methods in CodegeNativeType subclasses */
			allowProtoPropertiesByDefault: true,
		})
	} catch (error) {
		throw new Error(`Failed to generate template: "${templateName}": ${error.message}`)
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
		await fs.writeFile(outputPath, outputString, { encoding: 'utf-8' })
	}
}

export function registerStandardHelpers(hbs: typeof Handlebars, { generator, utils }: CodegenGeneratorContext): void {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function convertToString(value: any) {
		if (value === undefined) {
			return undefined
		}
		if (typeof value === 'string') {
			return value
		}
		if (typeof value === 'object') {
			return value.toString()
		}
		if (typeof value === 'function') {
			return value.name
		}
		return `${value}`
	}
	/** Convert the string argument to a class name using the generator */
	hbs.registerHelper('className', function(name: string) {
		if (name !== undefined) {
			return generator().toClassName(convertToString(name))
		} else {
			console.warn(`className helper has invalid parameter: ${name}`)
			return name
		}
	})

	/** Convert the given name to be a safe, appropriately named identifier for the language */
	hbs.registerHelper('identifier', function(name: string) {
		if (name !== undefined) {
			return generator().toIdentifier(convertToString(name))
		} else {
			console.warn(`identifier helper has invalid parameter: ${name}`)
			return name
		}
	})

	/** Convert the given name to a constant name */
	hbs.registerHelper('constantName', function(name: string) {
		if (name !== undefined) {
			return generator().toConstantName(convertToString(name))
		} else {
			console.warn(`constantName helper has invalid parameter: ${name}`)
			return name
		}
	})

	/** Capitalize the given string */
	hbs.registerHelper('capitalize', function(value: string) {
		if (value !== undefined) {
			return capitalize(convertToString(value))
		} else {
			return value
		}
	})

	/** Uppercase the given string */
	hbs.registerHelper('upperCase', function(value: string) {
		if (value !== undefined) {
			return convertToString(value).toLocaleUpperCase()
		} else {
			return value
		}
	})

	/** Lowercase the given string */
	hbs.registerHelper('lowerCase', function(value: string) {
		if (value !== undefined) {
			return convertToString(value).toLocaleLowerCase()
		} else {
			return value
		}
	})

	/** Camel case the given string */
	hbs.registerHelper('camelCase', function(value: string) {
		if (value !== undefined) {
			return camelCase(convertToString(value))
		} else {
			return value
		}
	})

	/** Pascal case the given string */
	hbs.registerHelper('pascalCase', function(value: string) {
		if (value !== undefined) {
			return pascalCase(convertToString(value))
		} else {
			return value
		}
	})

	/** Snake case the given string */
	hbs.registerHelper('snakeCase', function(value: string) {
		if (value !== undefined) {
			return snakeCase(convertToString(value))
		} else {
			return value
		}
	})

	/** All caps snake case the given string */
	hbs.registerHelper('allCapsSnakeCase', function(value: string) {
		if (value !== undefined) {
			return constantCase(convertToString(value))
		} else {
			return value
		}
	})

	hbs.registerHelper('sentenceCase', function(value: string) {
		if (value !== undefined) {
			return sentenceCase(convertToString(value))
		} else {
			return value
		}
	})

	hbs.registerHelper('capitalCase', function(value: string) {
		if (value !== undefined) {
			return capitalCase(convertToString(value))
		} else {
			return value
		}
	})

	hbs.registerHelper('plural', function(value: string) {
		if (value !== undefined) {
			return pluralize(convertToString(value))
		} else {
			return value
		}
	})

	hbs.registerHelper('singular', function(value: string) {
		if (value !== undefined) {
			return pluralize.singular(convertToString(value))
		} else {
			return value
		}
	})

	hbs.registerHelper('concat', function() {
		const values = []
		for (let i = 0; i < arguments.length - 1; i++) { /* Remove HelperOptions */
			// eslint-disable-next-line prefer-rest-params
			values.push(convertToString(arguments[i]))
		}
		if (values !== undefined) {
			return values.join('')
		} else {
			return values[0]
		}
	})

	/** Format the given string as a string literal, including quotes as required */
	hbs.registerHelper('stringLiteral', function(value: string) {
		if (value === null || value === undefined || typeof value === 'string') {
			return generator().toLiteral(value, utils.stringLiteralValueOptions())
		} else {
			throw new Error(`Unexpected argument type to stringLiteral helper: ${typeof value} (${value})`)
		}
	})

	/** Block helper that evaluates if there are more items in the current iteration context */
	hbs.registerHelper('hasMore', function(this: UnknownObject, options: HelperOptions) {
		if (options.data.last === false) {
			return options.fn(this)
		} else {
			return options.inverse(this)
		}
	})

	/** Convert a string to a "safe" string for Handlebars. Useful for outputting {} characters. */
	hbs.registerHelper('safe', function(value: string) {
		return new Handlebars.SafeString(convertToString(value))
	})

	/** Test if two arguments are equal */
	hbs.registerHelper('ifeq', function(this: UnknownObject, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
		if (!options) {
			throw new Error('ifeq helper must be called with two arguments')
		}

		if (a == b) {
			return options.fn(this)
		} else {
			return options.inverse(this)
		}
	})
	hbs.registerHelper('ifneq', function(this: UnknownObject, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
		if (!options) {
			throw new Error('ifneq helper must be called with two arguments')
		}

		if (a != b) {
			return options.fn(this)
		} else {
			return options.inverse(this)
		}
	})
	
	hbs.registerHelper('ifdef', function(this: UnknownObject, value: unknown, options: Handlebars.HelperOptions) {
		if (!options) {
			throw new Error('ifdef helper must be called with one argument')
		}

		if (value !== undefined) {
			return options.fn(this)
		} else {
			return options.inverse(this)
		}
	})
	
	hbs.registerHelper('ifndef', function(this: UnknownObject, value: unknown, options: Handlebars.HelperOptions) {
		if (!options) {
			throw new Error('ifndef helper must be called with one argument')
		}

		if (value === undefined) {
			return options.fn(this)
		} else {
			return options.inverse(this)
		}
	})

	hbs.registerHelper('or', function(this: UnknownObject) {
		const values = []
		// eslint-disable-next-line prefer-rest-params
		const options: Handlebars.HelperOptions = arguments[arguments.length - 1]
		for (let i = 0; i < arguments.length - 1; i++) { /* Remove HelperOptions */
			// eslint-disable-next-line prefer-rest-params
			values.push(arguments[i])
		}

		for (const value of values) {
			if (value) {
				return options.fn(this)
			}
		}

		return options.inverse(this)
	})
	hbs.registerHelper('and', function(this: UnknownObject) {
		const values = []
		// eslint-disable-next-line prefer-rest-params
		const options: Handlebars.HelperOptions = arguments[arguments.length - 1]
		for (let i = 0; i < arguments.length - 1; i++) { /* Remove HelperOptions */
			// eslint-disable-next-line prefer-rest-params
			values.push(arguments[i])
		}

		for (const value of values) {
			if (!value) {
				return options.inverse(this)
			}
		}

		return options.fn(this)
	})
	hbs.registerHelper('not', function(this: UnknownObject, value: unknown) {
		return !value
	})

	/** Test if the first argument contains the second */
	hbs.registerHelper('ifcontains', function(this: UnknownObject, haystack: unknown[], needle: unknown, options: Handlebars.HelperOptions) {
		if (!options) {
			throw new Error('ifcontains helper must be called with two arguments')
		}

		if (haystack && haystack.indexOf(needle) !== -1) {
			return options.fn(this)
		} else {
			return options.inverse(this)
		}
	})

	/** Output the undefined value literal for the given typed object. */
	hbs.registerHelper('undefinedValueLiteral', function(typeInfo: CodegenTypeInfo) {
		if (typeInfo !== undefined) {
			if (typeInfo.propertyType === undefined || typeInfo.nativeType === undefined) {
				throw new Error('undefinedValueLiteral helper must be called with a CodegenTypeInfo argument')
			}
			return generator().toDefaultValue(undefined, {
				...typeInfo,
				required: false,
			}).literalValue
		} else {
			return undefined
		}
	})

	/** Output the first parameter, unless it's undefined, in which case output the second (default) paramter. */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	hbs.registerHelper('coalesce', function(value: any, defaultValue: any) {
		if (value !== undefined) {
			return value
		} else {
			return defaultValue
		}
	})

	/* Property type helpers */
	registerPropertyTypeHelper('isObject', CodegenPropertyType.OBJECT, hbs)
	registerPropertyTypeHelper('isMap', CodegenPropertyType.MAP, hbs)
	registerPropertyTypeHelper('isArray', CodegenPropertyType.ARRAY, hbs)
	registerPropertyTypeHelper('isBoolean', CodegenPropertyType.BOOLEAN, hbs)
	registerPropertyTypeHelper('isNumber', CodegenPropertyType.NUMBER, hbs)
	registerPropertyTypeHelper('isEnum', CodegenPropertyType.ENUM, hbs)
	registerPropertyTypeHelper('isString', CodegenPropertyType.STRING, hbs)
	registerPropertyTypeHelper('isDateTime', CodegenPropertyType.DATETIME, hbs)
	registerPropertyTypeHelper('isDate', CodegenPropertyType.DATE, hbs)
	registerPropertyTypeHelper('isTime', CodegenPropertyType.TIME, hbs)
	registerPropertyTypeHelper('isFile', CodegenPropertyType.FILE, hbs)

	function isEmpty(ob: UnknownObject) {
		for (const name in ob) {
			return false
		}

		return true
	}

	/** Block helper for CodegenResponse or CodegenRequestBody to check if it has examples */
	hbs.registerHelper('hasExamples', function(this: UnknownObject, target: CodegenResponse | CodegenRequestBody, options: Handlebars.HelperOptions) {
		if (target.contents && target.contents.find(c => c.examples && !isEmpty(c.examples))) {
			return options.fn(this)
		} else {
			return options.inverse(this)
		}
	})

	/** Return an array of unique and not shadowed inherited properties for the current model. */
	hbs.registerHelper('inheritedProperties', function(this: CodegenModel, options: Handlebars.HelperOptions) {
		if (!options || !options.hash) {
			throw new Error('inheritedProperties helper must be called with no arguments')
		}

		if (this.parent) {
			const parentProperties = uniquePropertiesIncludingInherited(this.parent)
			if (this.properties) {
				const myProperties = this.properties
				return parentProperties.filter(p => !idx.get(myProperties, p.name))
			} else {
				return parentProperties
			}
		} else {
			return []
		}
	})

	hbs.registerHelper('nonDefaultResponses', function(this: CodegenOperation, options: Handlebars.HelperOptions) {
		if (!options || !options.hash) {
			throw new Error('nonDefaultResponses helper must be called with no arguments')
		}

		if (this.responses) {
			return idx.allValues(this.responses).filter(response => !response.isDefault)
		} else {
			return []
		}
	})

	hbs.registerHelper('md', function(value: string) {
		if (typeof value === 'string') {
			return marked(value).trim()
		} else {
			return value
		}
	})
}

function registerPropertyTypeHelper(name: string, propertyType: CodegenPropertyType, hbs: typeof Handlebars) {
	hbs.registerHelper(name, function(this: CodegenTypeInfo) {
		const aPropertyType = this.propertyType
		if (propertyType === undefined) {
			throw new Error(`${name} helper used without propertyType in the context`)
		}

		return (aPropertyType === propertyType)
	})
}
