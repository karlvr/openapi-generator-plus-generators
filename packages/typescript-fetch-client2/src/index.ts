import { CodegenGeneratorConstructor, CodegenGeneratorType, CodegenSchemaType, isCodegenAnyOfSchema, isCodegenEnumSchema, isCodegenInterfaceSchema, isCodegenObjectSchema, isCodegenOneOfSchema } from '@openapi-generator-plus/types'
import path from 'path'
import { emit } from '@openapi-generator-plus/template-utils'
import typescriptGenerator, { options as typescriptCommonOptions, TypeScriptGeneratorContext, chainTypeScriptGeneratorContext, TemplateRootContext } from '@openapi-generator-plus/typescript-generator-common'
import { CodegenOptionsTypeScriptFetchClient } from './types'
import * as idx from '@openapi-generator-plus/indexed-type'
import {
	api,
	models,
	runtime,
	configuration,
	entry,
	readme,
	packageJson,
	tsconfig,
	FetchClient2Hooks,
	RootContext,
} from './templates'

/**
 * Extension to {@link TypeScriptGeneratorContext} for downstream generators
 * (e.g. typescript-fetch-node-client2) that want to override fragments of
 * fetch-client2's templates. Set the `fetchClient2Hooks` field on the chained
 * context.
 */
export interface FetchClient2Context extends TypeScriptGeneratorContext {
	fetchClient2Hooks?: FetchClient2Hooks
}

const createGenerator: CodegenGeneratorConstructor = (config, context) => {
	const myContext: FetchClient2Context = chainTypeScriptGeneratorContext(context, {
		additionalWatchPaths: () => {
			return [path.resolve(__dirname, 'templates')]
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

	const hooks: FetchClient2Hooks = myContext.fetchClient2Hooks ?? {}

	myContext.templates = {
		package: (ctx) => packageJson(ctx, hooks),
		tsconfig,
	}

	myContext.exportFiles = async(outputPath, doc, rootContext) => {
		const root = rootContext as RootContext
		const relativeSourceOutputPath = generatorOptions.relativeSourceOutputPath

		for (const group of doc.groups) {
			if (group.operations.length === 0) {
				continue
			}

			/* Decide whether to add UnauthorizedResponse handling per operation */
			for (const op of group.operations) {
				const addUnauthorizedResponseHandling: boolean = !!op.securityRequirements && !op.catchAllResponse && (!op.responses || !idx.allValues(op.responses).find(r => r.code === 401))
				;(op as { addUnauthorizedResponseHandling?: boolean }).addUnauthorizedResponseHandling = addUnauthorizedResponseHandling
			}

			const apiOutput = api(myContext, { ...root, ...doc, group } as TemplateRootContext & RootContext & typeof doc & { group: typeof group }, hooks)
			await emit(apiOutput, path.join(outputPath, relativeSourceOutputPath, 'api', `${myContext.generator().toIdentifier(group.name)}.ts`), true)
		}

		const filteredDoc = {
			...doc,
			schemas: idx.filter(doc.schemas, schema => isCodegenObjectSchema(schema) || isCodegenEnumSchema(schema) || isCodegenOneOfSchema(schema) || isCodegenAnyOfSchema(schema) || isCodegenInterfaceSchema(schema)),
		}

		await emit(models(myContext, { ...root, ...filteredDoc } as RootContext & typeof filteredDoc, hooks), path.join(outputPath, relativeSourceOutputPath, 'models.ts'), true)
		await emit(runtime({ ...root, ...doc } as RootContext & typeof doc, hooks), path.join(outputPath, relativeSourceOutputPath, 'runtime.ts'), true)
		await emit(configuration({ ...root, ...doc } as RootContext & typeof doc), path.join(outputPath, relativeSourceOutputPath, 'configuration.ts'), true)
		await emit(entry(myContext, { ...root, ...doc } as RootContext & typeof doc, hooks), path.join(outputPath, relativeSourceOutputPath, 'index.ts'), true)
		await emit(readme({ ...root, ...doc } as RootContext & typeof doc), path.join(outputPath, 'README.md'), false)
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

export { FetchClient2Hooks, ApiResponseContentArgs, RootContext } from './templates'
export default createGenerator
