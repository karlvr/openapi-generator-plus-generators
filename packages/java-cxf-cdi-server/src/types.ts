import { CodegenOptions, CodegenConfig } from '@openapi-generator-plus/core'

/**
 * Options specific to Java that the user can provide to the code generation process.
 */
export interface CodegenOptionsJava extends CodegenOptions {
	apiPackage: string
	apiServiceImplPackage: string
	modelPackage: string
	invokerPackage: string
	useBeanValidation: boolean

	dateImplementation: string
	timeImplementation: string
	dateTimeImplementation: string

	constantStyle: ConstantStyle
	imports?: string[]

	hideGenerationTimestamp: boolean
	authenticatedOperationAnnotation?: string
}

export const enum ConstantStyle {
	allCapsSnake = 'snake',
	allCaps = 'allCaps',
	camelCase = 'camelCase',
}

export interface MavenOptions {
	groupId: string
	artifactId: string
	version: string
}
