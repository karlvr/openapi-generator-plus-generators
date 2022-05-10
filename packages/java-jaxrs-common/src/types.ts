import { JavaLikeOptions } from '@openapi-generator-plus/java-like-generator-helper'

/**
 * Options specific to Java that the user can provide to the code generation process.
 */
export interface CodegenOptionsJava extends JavaLikeOptions {
	apiPackage: string
	apiImplPackage: string
	modelPackage: string
	useBeanValidation: boolean
	validationPackage: string
	includeTests: boolean
	junitVersion: number

	dateImplementation: string
	timeImplementation: string
	dateTimeImplementation: string
	binaryRepresentation: string

	imports: string[] | null

	hideGenerationTimestamp: boolean

	maven: MavenOptions | null
	relativeSourceOutputPath: string
	relativeResourcesOutputPath?: string
	relativeTestOutputPath: string
	relativeTestResourcesOutputPath?: string
	customTemplatesPath?: string

	/**
	 * Use jakarta instead of javax for imports
	 */
	useJakarta: boolean
}

export interface MavenOptions {
	groupId: string
	artifactId: string
	version: string
	versions: {
		[name: string]: unknown
	}
}
