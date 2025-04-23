import { CodegenGeneratorConstructor, CodegenGeneratorType, CodegenSchemaType, isCodegenAnyOfSchema, isCodegenEnumSchema, isCodegenInterfaceSchema, isCodegenObjectSchema, isCodegenOneOfSchema } from '@openapi-generator-plus/types'
import path from 'path'
import { loadTemplates, emit } from '@openapi-generator-plus/handlebars-templates'
import typescriptGenerator, { options as typescriptCommonOptions, TypeScriptGeneratorContext, chainTypeScriptGeneratorContext } from '@openapi-generator-plus/typescript-generator-common'
import { CodegenOptionsTypeScriptFetchClient } from './types'
import * as idx from '@openapi-generator-plus/indexed-type'

const createGenerator: CodegenGeneratorConstructor = (config, context) => {
	const myContext: TypeScriptGeneratorContext = chainTypeScriptGeneratorContext(context, {
		loadAdditionalTemplates: async(hbs) => {
			await loadTemplates(path.resolve(__dirname, '../templates'), hbs)
		},
		additionalWatchPaths: () => {
			return [path.resolve(__dirname, '../templates')]
		},
		defaultNpmOptions: () => ({
			name: 'typescript-fetch-api',
			version: '0.0.1',
			private: true,
			repository: null,
		}),
		defaultTypeScriptOptions: () => ({
			target: 'ES5',
			libs: ['$target', 'DOM', 'ES2021.String'],
		}),
		toEnumLiteral(value, options) {
			/* We just want to output the literal string value as we change enums to disjunctions */
			return myContext.generator().toLiteral(value, {
				...options,
				schemaType: CodegenSchemaType.STRING,
			})
		},
	})

	const generatorOptions: CodegenOptionsTypeScriptFetchClient = {
		...typescriptCommonOptions(config, myContext),
		includePolyfills: config.includePolyfills !== undefined ? !!config.includePolyfills : true,
	}

	myContext.additionalExportTemplates = async(outputPath, doc, hbs, rootContext) => {
		const relativeSourceOutputPath = generatorOptions.relativeSourceOutputPath
		for (const group of doc.groups) {
			if (group.operations.length === 0) {
				continue
			}

			await emit('api', path.join(outputPath, relativeSourceOutputPath, 'api', `${context.generator().toIdentifier(group.name)}.ts`),
				{ ...rootContext, ...doc, ...group }, true, hbs)
		}

		await emit('apis', path.join(outputPath, relativeSourceOutputPath, 'apis.ts'), { ...rootContext, ...doc }, true, hbs);
		await emit('models', path.join(outputPath, relativeSourceOutputPath, 'models.ts'), {
			...rootContext,
			...doc,
			schemas: idx.filter(doc.schemas, schema => isCodegenObjectSchema(schema) || isCodegenEnumSchema(schema) || isCodegenOneOfSchema(schema) || isCodegenAnyOfSchema(schema) || isCodegenInterfaceSchema(schema)),
		}, true, hbs)
		await emit('runtime', path.join(outputPath, relativeSourceOutputPath, 'runtime.ts'), { ...rootContext, ...doc }, true, hbs)
		await emit('configuration', path.join(outputPath, relativeSourceOutputPath, 'configuration.ts'), { ...rootContext, ...doc }, true, hbs)
		await emit('index', path.join(outputPath, relativeSourceOutputPath, 'index.ts'), { ...rootContext, ...doc }, true, hbs)
		await emit('README', path.join(outputPath, 'README.md'), { ...rootContext, ...doc }, true, hbs)
	}

	const base = typescriptGenerator(config, myContext)

	return {
		...base,
		templateRootContext: () => {
			return {
				...base.templateRootContext(),
				...generatorOptions,
				generatorClass: '@openapi-generator-plus/typescript-fetch-client-generator',
			}
		},
		generatorType: () => CodegenGeneratorType.CLIENT,
		toNativeType: function(options) {
			const { schemaType } = options
			if (schemaType === CodegenSchemaType.BINARY || schemaType === CodegenSchemaType.FILE) {
				/* We support string and Blob, which is what FormData supports. It also enables us to handle literal binary values
				   created from strings... which is hopefully a good idea.
				 */
				return new context.NativeType('string | Blob')
			} else {
				return base.toNativeType(options)
			}
		},
		toSuggestedSchemaName: (name, options) => {
			if (options.schemaType === CodegenSchemaType.ENUM) {
				/* We don't add a suffix to enums as we generate them as disjunctions */
				return name
			} else {
				return base.toSuggestedSchemaName(name, options)
			}
		},
		postProcessDocument: (doc) => {
			for (const group of doc.groups) {
				for (const op of group.operations) {
					if (op.parameters) {
						op.parameters = idx.filter(op.parameters, param => param.in !== 'header' || !isForbiddenHeaderName(param.name))
					}
					if (op.headerParams) {
						op.headerParams = idx.filter(op.headerParams, param => !isForbiddenHeaderName(param.name))
					}
				}
			}
		},
	}
}

/** See https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_header_name */
function isForbiddenHeaderName(name: string): boolean {
	if (name.toLowerCase().startsWith('proxy-') || name.toLowerCase().startsWith('sec-')) {
		return true
	}
	return [
		'Accept-Charset', 'Accept-Encoding', 'Access-Control-Request-Headers', 'Access-Control-Request-Method',
		'Connection', 'Content-Length', 'Cookie', 'Cookie2', 'Date', 'DNT', 'Expect', 'Feature-Policy', 'Host',
		'Keep-Alive', 'Origin', 'Referer', 'TE', 'Trailer', 'Transfer-Encoding', 'Upgrade', 'Via',
	].map(h => h.toLowerCase()).includes(name.toLowerCase())
}

export default createGenerator

