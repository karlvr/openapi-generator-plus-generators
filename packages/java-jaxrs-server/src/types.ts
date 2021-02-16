import { CodegenOptionsJava as CommonCodegenOptions } from '@openapi-generator-plus/java-jaxrs-generator-common'

export interface CodegenOptionsJavaServer extends CommonCodegenOptions {
	apiServicePackage: string
	apiServiceImplPackage: string
	invokerPackage: string | null
	
	authenticatedOperationAnnotation: string | null
}
