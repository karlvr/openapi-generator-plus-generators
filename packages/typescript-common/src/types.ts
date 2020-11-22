import { JavaLikeOptions } from '@openapi-generator-plus/java-like-generator-helper'

/**
 * Options specific to the template that the user can provide to the code generation process.
 */
export interface CodegenOptionsTypeScript extends JavaLikeOptions {
	relativeSourceOutputPath: string
	npm: NpmOptions | null
	typescript: TypeScriptOptions | null
	customTemplatesPath: string | null
}

export interface TypeScriptOptions {
	target: string
	libs: string[]
}

export interface NpmOptions {
	name: string
	version: string
	repository: string | null
	private: boolean | null
}
