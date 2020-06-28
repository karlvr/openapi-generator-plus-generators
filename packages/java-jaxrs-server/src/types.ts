import { CodegenOptionsJava as CommonCodegenOptions } from '@openapi-generator-plus/java-jaxrs-common-generator'

export interface CodegenOptionsJavaServer extends CommonCodegenOptions {
	apiServiceImplPackage: string
	invokerPackage: string
	
	authenticatedOperationAnnotation?: string
}
