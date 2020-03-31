import { promises as fs } from 'fs'
import path from 'path'
import Handlebars, { HelperOptions } from 'handlebars'
import { camelCase, capitalize, pascalCase, CodegenState, stringLiteralValueOptions, CodegenOptions } from '@openapi-generator-plus/core'
import { snakeCase, constantCase } from 'change-case'

async function compileTemplate(templatePath: string, hbs: typeof Handlebars) {
	const templateSource = await fs.readFile(templatePath, 'UTF-8')
	return hbs.compile(templateSource)
}

/**
 * Load all Handlebars (*.hbs) templates from the given directory as partials.
 * @param templateDirPath path to template dir
 * @param hbs Handlebars instance
 */
export async function loadTemplates(templateDirPath: string, hbs: typeof Handlebars, prefix = '') {
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
export async function emit(templateName: string, outputPath: string, context: object, replace: boolean, hbs: typeof Handlebars) {
	const template = hbs.partials[templateName]
	if (!template) {
		throw new Error(`Unknown template: ${templateName}`)
	}

	let outputString
	try {
		outputString = template(context)
	} catch (error) {
		console.error(`Failed to generate template "${templateName}": ${error.message}`)
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

export function registerStandardHelpers<O extends CodegenOptions>(hbs: typeof Handlebars, state: CodegenState<O>) {
	const generator = state.generator

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
			return generator.toClassName(convertToString(name), state)
		} else {
			throw new Error(`className helper has invalid name parameter: ${name}`)
		}
	})

	/** Convert the given name to be a safe, appropriately named identifier for the language */
	hbs.registerHelper('identifier', function(name: string) {
		if (name !== undefined) {
			return generator.toIdentifier(convertToString(name), state)
		} else {
			throw new Error(`identifier helper has invalid parameter: ${name}`)
		}
	})

	/** Convert the given name to a constant name */
	hbs.registerHelper('constantName', function(name: string) {
		if (name !== undefined) {
			return generator.toConstantName(convertToString(name), state)
		} else {
			throw new Error(`constantName helper has invalid parameter: ${name}`)
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

	/** Format the given string as a string literal, including quotes as required */
	hbs.registerHelper('stringLiteral', function(value: string) {
		return generator.toLiteral(value, stringLiteralValueOptions(state), state)
	})

	/** Block helper that evaluates if there are more items in the current iteration context */
	hbs.registerHelper('hasMore', function(this: object, options: HelperOptions) {
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
}
