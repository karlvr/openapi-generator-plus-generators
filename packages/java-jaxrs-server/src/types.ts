import { CodegenOptionsJava as CommonCodegenOptions } from '@openapi-generator-plus/java-jaxrs-generator-common'

export interface CodegenOptionsJavaServer extends CommonCodegenOptions {
	apiServicePackage: string
	apiServiceImplPackage: string | null
	apiProviderPackage: string
	invokerPackage: string | null
	
	authenticationRequiredAnnotation: string | null
}
