import { JavaLikeOptions } from '@openapi-generator-plus/java-like-generator-helper'

/**
 * Options specific to the template that the user can provide to the code generation process.
 */
export interface CodegenOptionsDocumentation extends JavaLikeOptions{
	customTemplatesPath?: string
}
