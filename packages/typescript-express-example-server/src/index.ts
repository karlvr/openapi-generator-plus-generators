import { CodegenGeneratorConstructor, CodegenGeneratorType } from '@openapi-generator-plus/types'
import path from 'path'
import { loadTemplates, emit } from '@openapi-generator-plus/handlebars-templates'
import typescriptGenerator, { options as typescriptGeneratorOptions, TypeScriptGeneratorContext } from '@openapi-generator-plus/typescript-generator-common'

const createGenerator: CodegenGeneratorConstructor<TypeScriptGeneratorContext> = (config, context) => {
	const myContext: TypeScriptGeneratorContext = {
		...context,
		loadAdditionalTemplates: async(hbs) => {
			/* Convert an operation path to an express path */
			hbs.registerHelper('expressPath', function(path: string) {
				if (!path) {
					return path
				}

				return path.replace(/\{([-a-zA-Z_]+)\}/g, ':$1')
			})
			await loadTemplates(path.resolve(__dirname, '../templates'), hbs)
		},
		additionalWatchPaths: () => {
			return [path.resolve(__dirname, '../templates')]
		},
		defaultNpmOptions: () => ({
			name: 'typescript-express-example-server',
			version: '0.0.1',
		}),
		defaultTypeScriptOptions: () => ({
			target: 'ES2015',
			libs: ['$target', 'DOM'],
		}),
		generatorClassName: () => '@openapi-generator-plus/typescript-node-express-server-generator',
	}

	const generatorOptions = typescriptGeneratorOptions(config, myContext)

	myContext.additionalExportTemplates = async(outputPath, doc, hbs, rootContext) => {
		const relativeSourceOutputPath = generatorOptions.relativeSourceOutputPath
		await emit('index', path.join(outputPath, relativeSourceOutputPath, 'index.ts'), { ...doc, ...generatorOptions, ...rootContext }, true, hbs)
	}

	const base = typescriptGenerator(config, myContext)

	return {
		...base,
		generatorType: () => CodegenGeneratorType.SERVER,
	}
}

export default createGenerator
