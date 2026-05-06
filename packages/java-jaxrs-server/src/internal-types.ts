import { CodegenHeader, CodegenNativeType, CodegenResponse } from '@openapi-generator-plus/types'

export interface MyResponse extends CodegenResponse {
	__wrapper: MyDefaultResponseWrapper | null
}

export interface MyDefaultResponseWrapper {
	name: string
	headers: CodegenHeader[] | null
	bodyNativeType: CodegenNativeType | null
	nativeType: CodegenNativeType
}
