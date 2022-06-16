import { promises as fs } from 'fs'
import path from 'path'
import Handlebars, { HelperOptions } from 'handlebars'
import { camelCase, capitalize, pascalCase, uniquePropertiesIncludingInherited, debugStringify, uniquePropertiesIncludingInheritedForParents } from '@openapi-generator-plus/generator-common'
import { CodegenGeneratorContext, CodegenSchemaType, CodegenResponse, CodegenRequestBody, CodegenObjectSchema, CodegenOperation, CodegenVendorExtensions, CodegenExamples, CodegenContent, CodegenLogLevel, CodegenSchemaUsage, CodegenSchema } from '@openapi-generator-plus/types'
import { snakeCase, constantCase, sentenceCase, capitalCase } from 'change-case'
import pluralize from 'pluralize'
import * as idx from '@openapi-generator-plus/indexed-type'
import { marked } from 'marked'
import { EOL } from 'os'

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

async function detectPreferredLineEnding(outputPath: string): Promise<string | undefined> {
	try {
		const existingFileString = await fs.readFile(outputPath, { encoding: 'utf-8' })
		const firstNewline = existingFileString.indexOf('\n')
		if (firstNewline !== -1) {
			if (firstNewline > 0) {
				const beforeFirstNewline = existingFileString.charAt(firstNewline - 1)
				if (beforeFirstNewline === '\r') {
					return '\r\n'
				}
			}
		}
		return '\n'
	} catch (error) {
		return undefined
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
		if (error instanceof Error) {
			const newError = new Error(`Failed to generate template "${templateName}": ${error.message}`)
			/* Use the original stack so we can see where we failed */
			newError.stack = `${newError.stack}\nCaused by ${error.stack}`
			throw newError
		} else {
			throw new Error(`Failed to generate template "${templateName}": ${error}`)
		}
	}

	if (outputPath === '-') {
		const normalisedOutputString = outputString.replace('\r\n', '\n').replace('\n', EOL)
		console.log(normalisedOutputString)
	} else {
		const preferredLineEnding = await detectPreferredLineEnding(outputPath) || EOL
		const normalisedOutputString = outputString.replace('\r\n', '\n').replace('\n', preferredLineEnding)

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
		await fs.writeFile(outputPath, normalisedOutputString, { encoding: 'utf-8' })
	}
}

export interface ActualHelperOptions extends Handlebars.HelperOptions {
	/* The helper name */
	name: string
	loc: {
		start: hbs.AST.Position
		end: hbs.AST.Position
	}
	lookupProperty: (object: unknown, propertyName: string) => unknown
}

/**
 * Return the current source position as a string
 * @param options the Handlebars helper options
 */
export function sourcePosition(options: ActualHelperOptions): string {
	if (!options || !options.loc) {
		return 'unknown'
	}
	if (options.loc.start.line !== options.loc.end.line) {
		return `${options.loc.start.line}:${options.loc.start.column + 1} - ${options.loc.end.line}:${options.loc.end.column + 1}`
	} else if (options.loc.start.column !== options.loc.end.column) {
		return `${options.loc.start.line}:${options.loc.start.column + 1}-${options.loc.end.column + 1}`
	} else {
		return `${options.loc.start.line}:${options.loc.start.column + 1}`
	}
}

export function registerStandardHelpers(hbs: typeof Handlebars, { generator, log, utils }: CodegenGeneratorContext): void {
	/* Reject unknown helpers or properties to aid debugging */
	hbs.registerHelper('helperMissing', function(...helperArguments: unknown[]) {
		const options = helperArguments[arguments.length - 1] as ActualHelperOptions
		const args = Array.prototype.slice.call(helperArguments, 0, helperArguments.length - 1)

		if (args.length) {
			throw new Error(`Unknown helper ${options.name}(${args}) @ ${sourcePosition(options)}`)
		} else {
			throw new Error(`Unknown helper or property "${options.name}" is not defined @ ${sourcePosition(options)}`)
		}
	})
	hbs.registerHelper('blockHelperMissing', function(...helperArguments: unknown[]) {
		const options = helperArguments[arguments.length - 1] as ActualHelperOptions

		throw new Error(`Unsupported block helper syntax for property "${options.name}" @ ${sourcePosition(options)}. Use {{#if ${options.name}}, {{#unless ${options.name}}} or {{#with ${options.name}}} instead.`)
	})

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function convertToString(value: any) {
		if (value === undefined) {
			return undefined
		}
		if (value === null) {
			return null
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
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions
		if (name !== undefined) {
			return generator().toClassName(convertToString(name))
		} else {
			throw new Error(`className helper has invalid parameter "${name}" @ ${sourcePosition(options)}`)
			return name
		}
	})

	/** Convert the given name to be a safe, appropriately named identifier for the language */
	hbs.registerHelper('identifier', function(name: string) {
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions
		if (name !== undefined) {
			try {
				return generator().toIdentifier(convertToString(name))
			} catch (error) {
				throw new Error(`${error instanceof Error ? error.message : error} @ ${sourcePosition(options)}`)
			}
		} else {
			console.warn(`identifier helper has invalid parameter "${name}" @ ${sourcePosition(options)}`)
			return name
		}
	})

	/** Convert the given name to a constant name */
	hbs.registerHelper('constantName', function(name: string) {
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions
		if (name !== undefined) {
			return generator().toConstantName(convertToString(name))
		} else {
			console.warn(`constantName helper has invalid parameter "${name}" @ ${sourcePosition(options)}`)
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
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions
		if (value === null || value === undefined || typeof value !== 'object') {
			return generator().toLiteral(value, utils.stringLiteralValueOptions())
		} else {
			throw new Error(`Unexpected argument type to stringLiteral helper "${value}" of type ${typeof value} @ ${sourcePosition(options)}`)
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

	/** A custom 'if' helper that detects errors in template usage */
	hbs.registerHelper('if', function(this: UnknownObject, condition: unknown) {
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions
		if (arguments.length !== 2) {
			throw new Error(`if helper must be called with one argument @ ${sourcePosition(options)}`)
		}
		if (condition === undefined) {
			// eslint-disable-next-line prefer-rest-params
			// console.log(this, arguments)
			throw new Error(`if helper called with undefined argument @ ${sourcePosition(options)}`)
		}

		if (!Handlebars.Utils.isEmpty(condition)) {
			return options.fn(this)
		} else {
			return options.inverse(this)
		}
	})
	/** A custom 'unless' helper that detects errors in template usage */
	hbs.registerHelper('unless', function(this: UnknownObject, condition: unknown) {
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions
		if (arguments.length !== 2) {
			throw new Error(`unless helper must be called with one argument @ ${sourcePosition(options)}`)
		}
		if (condition === undefined) {
			// eslint-disable-next-line prefer-rest-params
			// console.log(this, arguments)
			throw new Error(`unless helper called with undefined argument @ ${sourcePosition(options)}`)
		}

		if (!Handlebars.Utils.isEmpty(condition)) {
			return options.inverse(this)
		} else {
			return options.fn(this)
		}
	})

	/* A custom 'each' helper that detects errors in template usage */
	hbs.registerHelper('each', function(this: UnknownObject, context: unknown) {
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions
		if (arguments.length !== 2) {
			throw new Error(`each helper must be called with one argument @ ${sourcePosition(options)}`)
		}

		if (context === undefined) {
			throw new Error(`each helper called with undefined argument @ ${sourcePosition(options)}`)
		}
		if (context === null) {
			return options.inverse(this)
		}

		if (Array.isArray(context)) {
			const n = context.length
			if (n === 0) {
				return options.inverse(this)
			}

			let result = ''
			for (let i = 0; i < n; i++) {
				result += options.fn(context[i], {
					data: {
						root: options.data && options.data.root,
						index: i,
						first: i === 0,
						last: i === n - 1,
					},
				})
			}
			return result
		} else if (context && typeof context === 'object') {
			const keys = Object.keys(context)

			const n = keys.length
			if (n === 0) {
				return options.inverse(this)
			}

			let result = ''
			for (let i = 0; i < n; i++) {
				const key = keys[i]

				result += options.fn((context as Record<string, unknown>)[key], {
					data: {
						root: options.data && options.data.root,
						key,
						first: i === 0,
						last: i === n - 1,
					},
				})
			}
			return result
		} else {
			throw new Error(`Unsupported context type for each block handler: ${context}`)
		}
	})

	/* A custom 'with' helper that detects errors in templates */
	hbs.registerHelper('with', function(this: UnknownObject, context: unknown) {
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions
		if (arguments.length !== 2) {
			throw new Error(`with helper must be called with one argument @ ${sourcePosition(options)}`)
		}

		if (context === undefined) {
			throw new Error(`with helper called with undefined argument @ ${sourcePosition(options)}`)
		}
		if (context === null) {
			return options.inverse(this)
		}
		return options.fn(context)
	})

	/** A custom helper to check for vendor extensions */
	hbs.registerHelper('ifvex', function(this: UnknownObject, extensionName: string, nestedPropertyOrContext?: string | UnknownObject) {
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions
		if (arguments.length !== 2 && arguments.length !== 3) {
			throw new Error(`ifvex helper must be called with one or two arguments @ ${sourcePosition(options)}`)
		}

		if (arguments.length === 2) {
			nestedPropertyOrContext = undefined
		}

		if (extensionName === undefined) {
			throw new Error(`ifvex helper called with undefined extension name, perhaps missing quotes around the extension name @ ${sourcePosition(options)}`)
		}

		let source: UnknownObject
		if (typeof nestedPropertyOrContext === 'string') {
			source = options.lookupProperty(this, nestedPropertyOrContext) as UnknownObject
			if (source === null) {
				return options.inverse(this)
			}
			if (source === undefined) {
				throw new Error(`ifvex helper couldn't find nested object "${nestedPropertyOrContext} @ ${sourcePosition(options)}: ${debugStringify(this)}`)
			}
		} else if (typeof nestedPropertyOrContext === 'object') {
			source = nestedPropertyOrContext
		} else if (nestedPropertyOrContext) {
			throw new Error(`ifvex helper called with unknown second argument of type ${typeof nestedPropertyOrContext} @ ${sourcePosition(options)}: ${debugStringify(nestedPropertyOrContext)}`)
		} else {
			source = this
		}

		const vendorExtensions: CodegenVendorExtensions | null = source.vendorExtensions as CodegenVendorExtensions | null
		if (vendorExtensions === undefined) {
			throw new Error(`ifvex helper called with an object that doesn't support vendor extensions @ ${sourcePosition(options)}: ${debugStringify(this)}`)
		}

		if (vendorExtensions && vendorExtensions[extensionName] !== undefined) {
			return typeof options.fn === 'function' ? options.fn(this) : true
		} else {
			return typeof options.inverse === 'function' ? options.inverse(this) : false
		}
	})
	/** A custom helper to check for examples by name */
	hbs.registerHelper('ifeg', function(this: UnknownObject, exampleName: string) {
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions
		if (arguments.length !== 2) {
			throw new Error(`ifeg helper must be called with one argument @ ${sourcePosition(options)}`)
		}

		const examples: CodegenExamples = this.examples as CodegenExamples
		if (examples === undefined) {
			throw new Error(`ifeg helper called with an object that doesn't support examples @ ${sourcePosition(options)}: ${debugStringify(this)}`)
		}

		if (examples && examples[exampleName] !== undefined) {
			return typeof options.fn === 'function' ? options.fn(this) : true
		} else {
			return typeof options.inverse === 'function' ? options.inverse(this) : false
		}
	})

	/** Test if two arguments are equal */
	hbs.registerHelper('ifeq', function(this: UnknownObject, a: unknown, b: unknown) {
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions
		if (arguments.length !== 3) {
			throw new Error(`ifeq helper must be called with two arguments @ ${sourcePosition(options)}`)
		}

		if (a === undefined) {
			throw new Error(`ifeq helper called with undefined first argument @ ${sourcePosition(options)}`)
		}
		if (b === undefined) {
			throw new Error(`ifeq helper called with undefined second argument @ ${sourcePosition(options)}`)
		}

		if (a == b) {
			return typeof options.fn === 'function' ? options.fn(this) : true
		} else {
			return typeof options.inverse === 'function' ? options.inverse(this) : false
		}
	})
	hbs.registerHelper('ifmatch', function(this: UnknownObject, a: string, regexp: string, flags: string) {
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions
		if (arguments.length !== 3 && arguments.length !== 4) {
			throw new Error(`ifmatch helper must be called with two or three arguments @ ${sourcePosition(options)}`)
		}

		if (a === undefined) {
			throw new Error(`ifmatch helper called with undefined first argument @ ${sourcePosition(options)}`)
		}
		if (regexp === undefined) {
			throw new Error(`ifmatch helper called with undefined second argument @ ${sourcePosition(options)}`)
		}
		if (flags === undefined || typeof flags !== 'string') {
			flags = 'i'
		}

		if (new RegExp(regexp, flags).test(a)) {
			return typeof options.fn === 'function' ? options.fn(this) : true
		} else {
			return typeof options.inverse === 'function' ? options.inverse(this) : false
		}
	})
	hbs.registerHelper('ifneq', function(this: UnknownObject, a: unknown, b: unknown) {
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions
		if (arguments.length !== 3) {
			throw new Error(`ifneq helper must be called with two arguments @ ${sourcePosition(options)}`)
		}

		if (a === undefined) {
			throw new Error(`ifneq helper called with undefined first argument @ ${sourcePosition(options)}`)
		}
		if (b === undefined) {
			throw new Error(`ifneq helper called with undefined second argument @ ${sourcePosition(options)}`)
		}

		if (a != b) {
			return typeof options.fn === 'function' ? options.fn(this) : true
		} else {
			return typeof options.inverse === 'function' ? options.inverse(this) : false
		}
	})
	
	hbs.registerHelper('ifdef', function(this: UnknownObject, value: unknown) {
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions
		if (arguments.length !== 2) {
			throw new Error(`ifdef helper must be called with one argument @ ${sourcePosition(options)}`)
		}

		if (value !== undefined) {
			return typeof options.fn === 'function' ? options.fn(this) : true
		} else {
			return typeof options.inverse === 'function' ? options.inverse(this) : false
		}
	})
	
	hbs.registerHelper('ifndef', function(this: UnknownObject, value: unknown) {
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions
		if (arguments.length !== 2) {
			throw new Error(`ifndef helper must be called with one argument @ ${sourcePosition(options)}`)
		}

		if (value === undefined) {
			return typeof options.fn === 'function' ? options.fn(this) : true
		} else {
			return typeof options.inverse === 'function' ? options.inverse(this) : false
		}
	})

	hbs.registerHelper('or', function(this: UnknownObject) {
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions

		for (let i = 0; i < arguments.length - 1; i++) { /* Remove HelperOptions */
			// eslint-disable-next-line prefer-rest-params
			const value = arguments[i]
			if (value === undefined) {
				throw new Error(`or helper called with undefined argument ${i + 1} @ ${sourcePosition(options)}`)
			}

			if (value) {
				return typeof options.fn === 'function' ? options.fn(this) : true
			}
		}

		return typeof options.inverse === 'function' ? options.inverse(this) : false
	})
	hbs.registerHelper('and', function(this: UnknownObject) {
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions

		for (let i = 0; i < arguments.length - 1; i++) { /* Remove HelperOptions */
			// eslint-disable-next-line prefer-rest-params
			const value = arguments[i]
			if (value === undefined) {
				throw new Error(`and helper called with undefined argument ${i + 1} @ ${sourcePosition(options)}`)
			}

			if (!value) {
				return typeof options.inverse === 'function' ? options.inverse(this) : false
			}
		}

		return typeof options.fn === 'function' ? options.fn(this) : true
	})
	hbs.registerHelper('not', function(this: UnknownObject, value: unknown) {
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions
		if (arguments.length !== 2) {
			throw new Error(`not helper must be called with one argument @ ${sourcePosition(options)}`)
		}

		if (value === undefined) {
			throw new Error(`not helper called with undefined argument @ ${sourcePosition(options)}`)
		}

		return !value
	})

	/** Test if the first argument contains the second */
	hbs.registerHelper('ifcontains', function(this: UnknownObject, haystack: unknown[], needle: unknown) {
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions
		if (arguments.length !== 3) {
			throw new Error(`ifcontains helper must be called with two arguments @ ${sourcePosition(options)}`)
		}

		if (haystack === undefined) {
			throw new Error(`ifcontains helper called with undefined first argument @ ${sourcePosition(options)}`)
		}
		if (needle === undefined) {
			throw new Error(`ifcontains helper called with undefined second argument @ ${sourcePosition(options)}`)
		}

		if (haystack && haystack.indexOf(needle) !== -1) {
			return typeof options.fn === 'function' ? options.fn(this) : true
		} else {
			return typeof options.inverse === 'function' ? options.inverse(this) : false
		}
	})

	/** Output the undefined value literal for the given typed object. */
	hbs.registerHelper('undefinedValueLiteral', function(typeInfo: CodegenSchema) {
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions

		if (typeInfo !== undefined) {
			if (typeInfo.schemaType === undefined || typeInfo.nativeType === undefined) {
				throw new Error(`undefinedValueLiteral helper must be called with a CodegenSchemaInfo argument @ ${sourcePosition(options)}`)
			}
			const defaultValue = generator().defaultValue({
				...typeInfo,
				required: false,
			})
			if (defaultValue === null) {
				throw new Error(`undefinedValueLiteral helper cannot format a literal for type ${typeInfo.schemaType}`)
			}
			return defaultValue.literalValue
		} else {
			return undefined
		}
	})

	/** Output the first parameter, unless it's null, in which case output the second (default) paramter. */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	hbs.registerHelper('coalesce', function(value: any, defaultValue: any) {
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions
		if (arguments.length !== 3) {
			throw new Error(`ifcontains helper must be called with two arguments @ ${sourcePosition(options)}`)
		}

		if (value === undefined) {
			throw new Error(`coalesce helper called with undefined first argument @ ${sourcePosition(options)}`)
		}
		if (defaultValue === undefined) {
			throw new Error(`coalesce helper called with undefined second argument @ ${sourcePosition(options)}`)
		}

		if (value !== null) {
			return value
		} else {
			return defaultValue
		}
	})

	/**
	 * A helper for looking up a named key that may or may not appear in an object. If the key
	 * doesn't appear, `null` (or the defaultValue if defined) is returned rather than `undefined` in order not to trigger errors
	 * from other helpers due to the `undefined` value.
	 */
	hbs.registerHelper('lookup', function(context: Record<string, unknown>, field: string, defaultValue: unknown) {
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions
		if (arguments.length !== 3 && arguments.length !== 4) {
			throw new Error(`lookup helper must be called with two or three arguments @ ${sourcePosition(options)}`)
		}
		if (arguments.length === 3) {
			/* The last argument is the options, not the defaultValue as expected */
			defaultValue = undefined
		}

		if (context === undefined) {
			throw new Error(`lookup helper called with undefined first argument @ ${sourcePosition(options)}`)
		}
		if (field === undefined) {
			throw new Error(`lookup helper called with undefined second argument @ ${sourcePosition(options)}`)
		}

		const value = context !== null ? context[field] : undefined
		if (value === undefined) {
			return defaultValue || null
		}
		return value
	})

	/**
	 * Like the lookup helper, but performs a series of lookups, so that you can safely traverse an object hierarchy
	 * where there are multiple unsafe lookups (such as looking for whether a property exists).
	 */
	hbs.registerHelper('lookupseries', function() {
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions

		let result: unknown | null = null

		for (let i = 0; i < arguments.length - 1; i += 2) {
			// eslint-disable-next-line prefer-rest-params
			const context = arguments[i]
			if (i + 1 < arguments.length - 1) {
				// eslint-disable-next-line prefer-rest-params
				const field = arguments[i + 1]

				if (context === undefined) {
					throw new Error(`lookupseries helper called with undefined context argument ${i + 1} @ ${sourcePosition(options)}`)
				}
				if (field === undefined) {
					throw new Error(`lookupseries helper called with undefined field argument ${i + 2} @ ${sourcePosition(options)}`)
				}

				const value = context !== null ? context[field] : undefined
				if (value === undefined) {
					return null
				} else {
					result = value
				}
			} else {
				throw new Error(`lookupseries helper called with an uneven number of arguments @ ${sourcePosition(options)}`)
			}
		}

		return result
	})

	hbs.registerHelper('warn', function(message: string) {
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions
		if (arguments.length !== 2) {
			throw new Error(`warn helper must be called with one argument @ ${sourcePosition(options)}`)
		}
		log(CodegenLogLevel.WARN, `${message} @ ${sourcePosition(options)}`)
	})
	hbs.registerHelper('error', function(message: string) {
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions
		if (arguments.length !== 2) {
			throw new Error(`error helper must be called with one argument @ ${sourcePosition(options)}`)
		}

		throw new Error(`${message} @ ${sourcePosition(options)}`)
	})

	/* Property type helpers */
	registerPropertyTypeHelper('isObject', CodegenSchemaType.OBJECT, hbs)
	registerPropertyTypeHelper('isAllOf', CodegenSchemaType.ALLOF, hbs)
	registerPropertyTypeHelper('isAnyOf', CodegenSchemaType.ANYOF, hbs)
	registerPropertyTypeHelper('isOneOf', CodegenSchemaType.ONEOF, hbs)
	registerPropertyTypeHelper('isHierarchy', CodegenSchemaType.HIERARCHY, hbs)
	registerPropertyTypeHelper('isInterface', CodegenSchemaType.INTERFACE, hbs)
	registerPropertyTypeHelper('isWrapper', CodegenSchemaType.WRAPPER, hbs)
	registerPropertyTypeHelper('isMap', CodegenSchemaType.MAP, hbs)
	registerPropertyTypeHelper('isArray', CodegenSchemaType.ARRAY, hbs)
	registerPropertyTypeHelper('isBoolean', CodegenSchemaType.BOOLEAN, hbs)
	registerPropertyTypeHelper('isNumeric', [CodegenSchemaType.NUMBER, CodegenSchemaType.INTEGER], hbs)
	registerPropertyTypeHelper('isNumber', CodegenSchemaType.NUMBER, hbs)
	registerPropertyTypeHelper('isInteger', CodegenSchemaType.INTEGER, hbs)
	registerPropertyTypeHelper('isEnum', CodegenSchemaType.ENUM, hbs)
	registerPropertyTypeHelper('isString', CodegenSchemaType.STRING, hbs)
	registerPropertyTypeHelper('isDateTime', CodegenSchemaType.DATETIME, hbs)
	registerPropertyTypeHelper('isDate', CodegenSchemaType.DATE, hbs)
	registerPropertyTypeHelper('isTime', CodegenSchemaType.TIME, hbs)
	registerPropertyTypeHelper('isBinary', CodegenSchemaType.BINARY, hbs)

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

	/** Return an array of unique and not shadowed inherited properties for the current schema. */
	hbs.registerHelper('inheritedProperties', function(this: CodegenObjectSchema) {
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions
		if (arguments.length !== 1) {
			throw new Error(`inheritedProperties helper must be called with no arguments @ ${sourcePosition(options)}`)
		}

		if (this.parents) {
			const parentProperties = idx.allValues(uniquePropertiesIncludingInheritedForParents(this.parents))
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

	/** Return an array of unique and not shadowed properties, including inherited, for the current schema. */
	hbs.registerHelper('allProperties', function(this: CodegenObjectSchema, schema?: CodegenObjectSchema) {
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions
		if (arguments.length !== 1 && arguments.length !== 2) {
			throw new Error(`allProperties helper must be called with 0 or 1 arguments @ ${sourcePosition(options)}`)
		}
		if (arguments.length === 1) {
			schema = this
		} else if (!schema) {
			throw new Error(`allProperties helper called with undefined schema argument @ ${sourcePosition(options)}`)
		}

		return uniquePropertiesIncludingInherited(schema)
	})

	hbs.registerHelper('nonDefaultResponses', function(this: CodegenOperation) {
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions
		if (arguments.length !== 1) {
			throw new Error(`nonDefaultResponses helper must be called with no arguments @ ${sourcePosition(options)}`)
		}

		if (this.responses) {
			return idx.allValues(this.responses).filter(response => !response.isDefault)
		} else {
			return []
		}
	})

	hbs.registerHelper('responseContentAndNone', function(this: CodegenResponse): { content: CodegenContent | null }[] {
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions
		if (arguments.length !== 1) {
			throw new Error(`nonDefaultResponsesContent helper must be called with no arguments @ ${sourcePosition(options)}`)
		}

		if (this.contents) {
			return this.contents.map(content => ({ content }))
		} else {
			return [{
				content: null,
			}]
		}
	})

	hbs.registerHelper('md', function(value: string) {
		if (typeof value === 'string') {
			return marked(value).trim()
		} else {
			return value
		}
	})

	/**
	 * Set the named variable in the current scope to the value in the body of the block.
	 */
	hbs.registerHelper('set', function(this: UnknownObject, varName: string) {
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions
		if (arguments.length !== 2) {
			throw new Error(`set helper must be called with 1 argument @ ${sourcePosition(options)}`)
		}
		if (!varName) {
			throw new Error(`set helper must be called with 1 argument; missing or undefined first argument (varName) @ ${sourcePosition(options)}`)
		}

		const result = options.fn(this).trim()
		this[varName] = result
		return null
	})

	/**
	 * Join the non-empty lines of the body of the block together with the given separator, and set into the named variable
	 * in the current scope.
	 */
	hbs.registerHelper('join', function(this: UnknownObject, varName: string, separator: string) {
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions
		if (arguments.length !== 3) {
			throw new Error(`join helper must be called with 2 arguments @ ${sourcePosition(options)}`)
		}
		if (!varName) {
			throw new Error(`join helper must be called with 2 arguments; missing or undefined first argument (varName) @ ${sourcePosition(options)}`)
		}
		if (typeof separator !== 'string') {
			throw new Error(`join helper must be called with 2 arguments; missing or undefined second argument (separator) @ ${sourcePosition(options)}`)
		}

		const result = options.fn(this).split(/\r?\n/).filter(s => s.trim().length > 0).join(separator)
		this[varName] = result
		return null
	})

	/**
	 * Indent the lines of the body of this block element with the given string.
	 */
	hbs.registerHelper('indent', function(this: UnknownObject, indent: string) {
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions
		if (arguments.length !== 2) {
			throw new Error(`indent helper must be called with 1 argument @ ${sourcePosition(options)}`)
		}
		if (!indent) {
			throw new Error(`indent helper missing indent argument @ ${sourcePosition(options)}`)
		}

		return options.fn(this).split(/\r?\n/).join(`\n${indent}`)
	})

	/**
	 * Count the number of items in the collection argument and return.
	 */
	hbs.registerHelper('count', function(collection: unknown) {
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions
		if (arguments.length !== 2) {
			throw new Error(`count helper must be called with 1 argument @ ${sourcePosition(options)}`)
		}
		if (collection === undefined) {
			throw new Error(`count helper missing collection argument @ ${sourcePosition(options)}`)
		}

		if (!collection) {
			return 0
		} else if (Array.isArray(collection) || typeof collection === 'string') {
			return collection.length
		} else if (typeof collection === 'object') {
			return Object.keys(collection!).length
		} else {
			return String(collection).length
		}
	})

	registerComparisonHelper('gt', (a, b) => a > b, hbs)
	registerComparisonHelper('ge', (a, b) => a >= b, hbs)
	registerComparisonHelper('lt', (a, b) => a < b, hbs)
	registerComparisonHelper('le', (a, b) => a <= b, hbs)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function registerComparisonHelper(name: string, comparison: (a: any, b: any) => boolean, hbs: typeof Handlebars): void {
	hbs.registerHelper(name, function(a: unknown, b: unknown) {
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions
		if (arguments.length !== 3) {
			throw new Error(`${name} helper must be called with 2 argument @ ${sourcePosition(options)}`)
		}
		if (a === undefined) {
			throw new Error(`${name} helper missing first argument @ ${sourcePosition(options)}`)
		}
		if (b === undefined) {
			throw new Error(`${name} helper missing second argument @ ${sourcePosition(options)}`)
		}
		return comparison(a, b)
	})
}

function registerPropertyTypeHelper(name: string, schemaType: CodegenSchemaType, hbs: typeof Handlebars): void
function registerPropertyTypeHelper(name: string, schemaType: CodegenSchemaType[], hbs: typeof Handlebars): void
function registerPropertyTypeHelper(name: string, schemaType: CodegenSchemaType | CodegenSchemaType[], hbs: typeof Handlebars): void {
	hbs.registerHelper(name, function(this: CodegenSchemaUsage & CodegenSchema, target?: CodegenSchemaUsage & CodegenSchema) {
		// eslint-disable-next-line prefer-rest-params
		const options = arguments[arguments.length - 1] as ActualHelperOptions
		if (arguments.length < 2) {
			target = this
		} else if (target === undefined) {
			throw new Error(`${name} helper called with an undefined target argument @ ${sourcePosition(options)}`)
		}

		let aPropertyType = target.schemaType
		if (aPropertyType === undefined && target.schema) {
			/* We might be looking at a CodegenContent, CodegenRequestBody or CodegenParameter */
			aPropertyType = target.schema.schemaType
		}
		if (aPropertyType === undefined) {
			throw new Error(`${name} helper used without schemaType in the context @ ${sourcePosition(options)}: ${debugStringify(target)}`)
		}

		if (typeof schemaType === 'string') {
			return (aPropertyType === schemaType)
		} else {
			for (const aSchemaType of schemaType) {
				if (aPropertyType === aSchemaType) {
					return true
				}
			}
			return false
		}
		
	})
}
