import { CodegenGeneratorConstructor, CodegenGeneratorType } from '@openapi-generator-plus/types'
import path from 'path'
import { emit } from '@openapi-generator-plus/template-utils'
import typescriptGenerator, { options as typescriptGeneratorOptions, TypeScriptGeneratorContext, chainTypeScriptGeneratorContext } from '@openapi-generator-plus/typescript-generator-common'
import { index, packageJson, tsconfig } from './templates'

const createGenerator: CodegenGeneratorConstructor<TypeScriptGeneratorContext> = (config, context) => {
	const myContext: TypeScriptGeneratorContext = chainTypeScriptGeneratorContext(context, {
		defaultNpmOptions: () => ({
			name: 'typescript-express-example-server',
			version: '0.0.1',
			private: true,
			repository: null,
		}),
		defaultTypeScriptOptions: () => ({
			target: 'ES2015',
			libs: ['$target', 'DOM', 'ES2021.String'],
		}),
	})

	const generatorOptions = typescriptGeneratorOptions(config, myContext)

	myContext.templates = {
		package: packageJson,
		tsconfig,
	}

	myContext.exportFiles = async(outputPath, doc, rootContext) => {
		const relativeSourceOutputPath = generatorOptions.relativeSourceOutputPath
		await emit(index(rootContext), path.join(outputPath, relativeSourceOutputPath, 'index.ts'), true)
	}

	const base = typescriptGenerator(config, myContext)

	return {
		...base,
		templateRootContext: () => {
			return {
				...base.templateRootContext(),
				...generatorOptions,
				generatorClass: '@openapi-generator-plus/typescript-node-express-server-generator',
			}
		},
		generatorType: () => CodegenGeneratorType.SERVER,
	}
}

export default createGenerator
