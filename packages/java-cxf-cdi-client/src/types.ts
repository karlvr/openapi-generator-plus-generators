import { CodegenOptionsJavaClient as CommonCodegenOptions } from '@openapi-generator-plus/java-jaxrs-client-generator'

export interface CodegenOptionsCxfCdiClient extends CommonCodegenOptions {
	invokerPackage: string | null
	invokerImplPackage: string | null
}
