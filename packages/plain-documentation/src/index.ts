import { CodegenAllOfStrategy, CodegenAnyOfStrategy, CodegenGeneratorConstructor, CodegenGeneratorContext, CodegenGeneratorType, CodegenLogLevel, CodegenOneOfStrategy } from '@openapi-generator-plus/types'
import { CodegenOptionsDocumentation } from './types'
import path from 'path'
import { emit } from '@openapi-generator-plus/template-utils'
import { javaLikeGenerator, JavaLikeContext, ConstantStyle, options as javaLikeOptions, EnumMemberStyle } from '@openapi-generator-plus/java-like-generator-helper'
import { commonGenerator, configObject } from '@openapi-generator-plus/generator-common'
import { emit as emitLess } from './less-utils'
import { copyContents } from './static-utils'
import { promises as fs } from 'fs'
import { documentTemplate } from './templates/document'
import { DocumentContext, PlainDocumentationHooks } from './templates/types'

/**
 * Extension to {@link CodegenGeneratorContext} allowing a consumer to inject
 * markup into the extension points this generator's templates provide,
 * without forking the templates themselves. Set `hooks` on the context
 * passed to {@link createGenerator}.
 */
export interface PlainDocumentationGeneratorContext extends CodegenGeneratorContext {
	hooks?: PlainDocumentationHooks
}

function toSafeTypeForComposing(nativeType: string): string {
	if (/[^a-zA-Z0-9_.[\]]/.test(nativeType)) {
		return `(${nativeType})`
	} else {
		return nativeType
	}
}

export const createGenerator: CodegenGeneratorConstructor = (config, context) => {
	const myContext = context as PlainDocumentationGeneratorContext
	const hooks: PlainDocumentationHooks = myContext.hooks ?? {}

	const javaLikeContext: JavaLikeContext = {
		...context,
		defaultConstantStyle: ConstantStyle.allCapsSnake,
		defaultEnumMemberStyle: EnumMemberStyle.preserve,
	}

	if (config.customTemplates !== undefined) {
		context.log(CodegenLogLevel.WARN, 'The customTemplates config option is no longer supported: templates are TypeScript code and are customized via the generator\'s typed template and hook APIs')
	}

	const operationsConfig = configObject<CodegenOptionsDocumentation['operations']>(config, 'operations', {})!
	if (operationsConfig.navStyle === undefined) {
		operationsConfig.navStyle = 'name'
	}
	if (operationsConfig.exclude === undefined) {
		operationsConfig.exclude = []
	}

	const generatorOptions: CodegenOptionsDocumentation = {
		...javaLikeOptions(config, javaLikeContext),
		operations: operationsConfig,
	}

	const aCommonGenerator = commonGenerator(config, context)

	return {
		...context.baseGenerator(config, context),
		...aCommonGenerator,
		...javaLikeGenerator(config, javaLikeContext),
		generatorType: () => CodegenGeneratorType.DOCUMENTATION,
		toIdentifier: (name) => name,
		toLiteral: (value, options) => {
			if (value === undefined) {
				const defaultValue = context.generator().defaultValue(options)
				if (defaultValue === null) {
					return null
				}
				return defaultValue.literalValue
			}

			return `${value}`
		},
		toNativeType: (options) => {
			const { type, format } = options
			if (type === 'string') {
				if (format) {
					return new context.NativeType(format, {
						serializedType: 'string',
					})
				}
			} else if (type === 'integer') {
				if (format) {
					return new context.NativeType(format, {
						serializedType: 'number',
					})
				} else {
					return new context.NativeType(type, {
						serializedType: 'number',
					})
				}
			}

			return new context.NativeType(type)
		},
		toEnumMemberName: (name) => name,
		toNativeObjectType: function(options) {
			const { scopedName } = options
			let modelName = ''
			for (const name of scopedName) {
				modelName += `.${context.generator().toClassName(name)}`
			}
			return new context.NativeType(modelName.substring(1))
		},
		toNativeArrayType: (options) => {
			const { componentNativeType } = options
			return new context.NativeType(`${toSafeTypeForComposing(componentNativeType.nativeType)}[]`)
		},
		toNativeMapType: (options) => {
			const { keyNativeType, componentNativeType } = options
			return new context.NativeType(`{ [name: ${keyNativeType}]: ${componentNativeType} }`)
		},
		nativeTypeUsageTransformer: ({ nullable }) => ({
			default: function(nativeType, nativeTypeString) {
				if (nullable) {
					return `${toSafeTypeForComposing(nativeTypeString)} | null`
				}
				return nativeTypeString
			},
			/* We don't transform the concrete type as the concrete type is never null; we use it to make new objects */
			concreteType: null,
		}),
		defaultValue: () => {
			return null
		},
		initialValue: () => {
			return null
		},
		toOperationGroupName: (name) => {
			return name
		},
		operationGroupingStrategy: () => {
			return context.operationGroupingStrategies.addToGroupsByTagOrPath
		},
		allOfStrategy: () => CodegenAllOfStrategy.NATIVE,
		anyOfStrategy: () => CodegenAnyOfStrategy.NATIVE,
		oneOfStrategy: () => CodegenOneOfStrategy.NATIVE,
		supportsInheritance: () => false,
		supportsMultipleInheritance: () => false,
		nativeCompositionCanBeScope: () => true,
		nativeComposedSchemaRequiresName: () => false,
		nativeComposedSchemaRequiresObjectLikeOrWrapper: () => false,
		interfaceCanBeNested: () => true,

		watchPaths: () => {
			return [
				path.resolve(__dirname, '..', 'less'),
				path.resolve(__dirname, '..', 'static'),
			]
		},

		cleanPathPatterns: () => {
			return [
				'index.html',
				'static/**',
				'main.css',
				'custom.css',
			]
		},

		templateRootContext: () => {
			return {
				...aCommonGenerator.templateRootContext(),
				...generatorOptions,
				generatorClass: '@openapi-generator-plus/plain-documentation-generator',
			}
		},

		postProcessDocument(doc) {
			/* Apply excludes on operations */
			for (let i = 0; i < doc.groups.length; i++) {
				const group = doc.groups[i]

				for (let j = 0; j < group.operations.length; j++) {
					const op = group.operations[j]
					for (const exclude of generatorOptions.operations?.exclude || []) {
						if (op.fullPath.match(new RegExp(exclude))) {
							group.operations.splice(j, 1)
							j--
							break
						}
					}
				}

				if (group.operations.length === 0) {
					doc.groups.splice(i, 1)
					i--
				}
			}
		},

		exportTemplates: async(outputPath, doc) => {
			const rootContext = context.generator().templateRootContext()

			if (!outputPath.endsWith('/')) {
				outputPath += '/'
			}

			const documentContext = { ...rootContext, ...doc } as DocumentContext
			await emit(documentTemplate(documentContext, hooks), path.join(outputPath, 'index.html'), true)

			await emitLess(path.resolve(__dirname, '../less', 'style.less'), path.join(outputPath, 'static/css/main.css'))

			await fs.writeFile(path.join(outputPath, 'custom.css'), '', {})

			await copyContents(path.resolve(__dirname, '..', 'static'), path.join(outputPath, 'static'))
		},
	}
}

export { PlainDocumentationHooks } from './templates/types'
export default createGenerator
