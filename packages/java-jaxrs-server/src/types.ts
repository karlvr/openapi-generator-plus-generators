import { CodegenOptionsJava as CommonCodegenOptions } from '@openapi-generator-plus/java-jaxrs-generator-common'

export interface CodegenOptionsJavaServer extends CommonCodegenOptions {
	apiServicePackage: string
	apiServiceImplPackage: string | null
	invokerPackage: string | null
	invokerName: string | null
	
	authenticationRequiredAnnotation: string | null
}

declare module '@openapi-generator-plus/types' {
	interface CodegenOperation {
		useParamsClasses: boolean
	}
}
