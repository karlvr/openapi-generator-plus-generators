import { JavaLikeOptions } from '@openapi-generator-plus/java-like-generator-helper'

/**
 * Options specific to Java that the user can provide to the code generation process.
 */
export interface CodegenOptionsJava extends JavaLikeOptions {
	apiPackage: string
	apiImplPackage: string
	apiParamsPackage: string | null
	apiProviderPackage: string | null
	modelPackage: string
	supportPackage: string
	useBeanValidation: boolean
	validationPackage: string
	includeTests: boolean
	junitVersion: number

	dateImplementation: string
	timeImplementation: string
	dateTimeImplementation: string
	binaryRepresentation: string
	fileRepresentation: string

	imports: string[] | null

	hideGenerationTimestamp: boolean

	maven: MavenOptions | null
	relativeSourceOutputPath: string
	relativeApiSourceOutputPath: string
	relativeApiImplSourceOutputPath: string

	relativeResourcesOutputPath?: string
	relativeTestOutputPath: string
	relativeTestResourcesOutputPath?: string
	customTemplatesPath?: string

	/**
	 * Use jakarta instead of javax for imports
	 */
	useJakarta: boolean

	/**
	 * Whether to use Lombok annotations or not
	 */
	useLombok: boolean

	customizations: {
		classes: Record<string, JavaClassCustomizations>
	}
}

export interface MavenOptions {
	groupId: string
	artifactId: string
	version: string
	versions: {
		[name: string]: unknown
	}
}

export interface JavaClassCustomizations {
	/** Interfaces to add to the class */
	implements?: string[]
}

declare module '@openapi-generator-plus/types' {
	interface CodegenOperation {
		useParamsClasses: boolean
	}
}
