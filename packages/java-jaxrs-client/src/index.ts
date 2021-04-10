import { CodegenGeneratorType, CodegenGenerator, CodegenConfig, isCodegenObjectSchema } from '@openapi-generator-plus/types'
import path from 'path'
import { emit, loadTemplates } from '@openapi-generator-plus/handlebars-templates'
import javaGenerator, { options as javaGeneratorOptions, packageToPath, JavaGeneratorContext } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { CodegenOptionsJavaClient } from './types'
export { CodegenOptionsJavaClient } from './types'
export { packageToPath } from '@openapi-generator-plus/java-jaxrs-generator-common'

export function options(config: CodegenConfig, context: JavaGeneratorContext): CodegenOptionsJavaClient {
	const parentOptions = javaGeneratorOptions(config, context)
	const generatorOptions: CodegenOptionsJavaClient = {
		...parentOptions,
		apiSpecPackage: config.apiSpecPackage || `${parentOptions.apiPackage}.spec`,
		apiSpiPackage: config.apiSpiPackage || `${parentOptions.apiPackage}.spi`,
	}
	return generatorOptions
}

export default function createGenerator(config: CodegenConfig, context: JavaGeneratorContext): CodegenGenerator {
	const myContext: JavaGeneratorContext = {
		...context,
		loadAdditionalTemplates: async(hbs) => {
			await loadTemplates(path.resolve(__dirname, '../templates'), hbs)

			if (context.loadAdditionalTemplates) {
				await context.loadAdditionalTemplates(hbs)
			}
		},
		additionalWatchPaths: () => {
			const result = [path.resolve(__dirname, '../templates')]
			
			if (context.additionalWatchPaths) {
				result.push(...context.additionalWatchPaths())
			}

			return result
		},
	}

	const generatorOptions = options(config, myContext)

	myContext.additionalExportTemplates = async(outputPath, doc, hbs, rootContext) => {
		const relativeSourceOutputPath = generatorOptions.relativeSourceOutputPath

		const apiPackagePath = packageToPath(generatorOptions.apiPackage)
	
		for (const group of doc.groups) {
			const operations = group.operations
			if (!operations.length) {
				continue
			}

			await emit('api', path.join(outputPath, relativeSourceOutputPath, apiPackagePath, `${context.generator().toClassName(group.name)}Api.java`), 
				{ ...rootContext, ...group, operations }, true, hbs)
		}
		
		const apiImplPackagePath = packageToPath(generatorOptions.apiImplPackage)
		for (const group of doc.groups) {
			const operations = group.operations
			if (!operations.length) {
				continue
			}
			await emit('apiImpl', path.join(outputPath, relativeSourceOutputPath, apiImplPackagePath, `${context.generator().toClassName(group.name)}ApiImpl.java`), 
				{ ...rootContext, ...group, operations }, true, hbs)
		}

		await emit('ApiConstants', path.join(outputPath, relativeSourceOutputPath, apiPackagePath, 'ApiConstants.java'), {
			...rootContext, servers: doc.servers, server: doc.servers && doc.servers.length ? doc.servers[0] : null,
		}, true, hbs)
		await emit('ApiInvoker', path.join(outputPath, relativeSourceOutputPath, apiPackagePath, 'ApiInvoker.java'), 
			{ ...rootContext }, true, hbs)

		await emit('ApiProviders', path.join(outputPath, relativeSourceOutputPath, apiPackagePath, 'ApiProviders.java'), {
			...rootContext, servers: doc.servers, server: doc.servers && doc.servers.length ? doc.servers[0] : undefined,
		}, false, hbs)

		const apiSpecPackagePath = packageToPath(generatorOptions.apiSpecPackage)
		for (const group of doc.groups) {
			const operations = group.operations
			if (!operations.length) {
				continue
			}
			await emit('apiSpec', path.join(outputPath, relativeSourceOutputPath, apiSpecPackagePath, `${context.generator().toClassName(group.name)}ApiSpec.java`), 
				{ ...rootContext, ...group, operations }, true, hbs)
		}

		await emit('UnexpectedResponseException', path.join(outputPath, relativeSourceOutputPath, apiPackagePath, 'UnexpectedResponseException.java'), {
			...rootContext,
		}, true, hbs)

		await emit('UnprocessableResponseException', path.join(outputPath, relativeSourceOutputPath, apiPackagePath, 'UnprocessableResponseException.java'), {
			...rootContext,
		}, true, hbs)

		const apiSpiPackagePath = packageToPath(generatorOptions.apiSpiPackage)
		await emit('spi/ApiAuthorizationProvider', path.join(outputPath, relativeSourceOutputPath, apiSpiPackagePath, 'ApiAuthorizationProvider.java'), {
			...rootContext,
		}, true, hbs)

		if (context.additionalExportTemplates) {
			context.additionalExportTemplates(outputPath, doc, hbs, rootContext)
		}
	}

	myContext.additionalCleanPathPatterns = () => {
		const relativeSourceOutputPath = generatorOptions.relativeSourceOutputPath
		const apiSpecPackagePath = packageToPath(generatorOptions.apiSpecPackage)
		const result = [
			path.join(relativeSourceOutputPath, apiSpecPackagePath, '*ApiSpec.java'),
		]
		if (context.additionalCleanPathPatterns) {
			result.push(...context.additionalCleanPathPatterns())
		}
		return result
	}

	const base = javaGenerator(config, myContext)
	return {
		...base,
		templateRootContext: () => {
			return {
				...base.templateRootContext(),
				...generatorOptions,
				generatorClass: '@openapi-generator-plus/java-jaxrs-client-generator',
			}
		},
		generatorType: () => CodegenGeneratorType.CLIENT,

		postProcessDocument: (doc) => {
			if (base.postProcessDocument) {
				base.postProcessDocument(doc)
			}
			
			for (const group of doc.groups) {
				for (const op of group.operations) {
					if (op.defaultResponse && op.defaultResponse.defaultContent) {
						const schema = op.defaultResponse.defaultContent.schema
						if (isCodegenObjectSchema(schema)) {
							/* Check if this is a return type that we cannot deserialize, as we don't know what type it
							   is. We turn the return type into a generic Response so the user can decide which to read.
							 */
							if (schema.isInterface && !schema.discriminator && !schema.children) {
								op.returnNativeType = new context.NativeType('javax.ws.rs.core.Response')
							}
						}
					}
				}
			}
		},
	}
}
