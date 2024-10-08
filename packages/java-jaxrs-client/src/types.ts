import { CodegenOptionsJava as CommonCodegenOptions } from '@openapi-generator-plus/java-jaxrs-generator-common'

export interface CodegenOptionsJavaClient extends CommonCodegenOptions {
	apiSpecPackage: string
	apiSpiPackage: string
	connectionTimeoutMillis: number
	receiveTimeoutMillis: number
}

declare module '@openapi-generator-plus/types' {
	interface CodegenOperation {
		useParamsClasses: boolean
	}
}
