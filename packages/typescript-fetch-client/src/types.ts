import { CodegenOptions } from '@openapi-generator-plus/types'

/**
 * Options specific to the template that the user can provide to the code generation process.
 */
export interface CodegenOptionsTypescript extends CodegenOptions {
	relativeSourceOutputPath: string
	npm?: NpmOptions
	typescript?: TypeScriptOptions
}

export interface TypeScriptOptions {
	target: string
	libs: string
}

export interface NpmOptions {
	name: string
	version: string
	repository?: string
}
