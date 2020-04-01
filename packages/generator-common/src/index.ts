import { CodegenGenerator, CodegenOptions } from '@openapi-generator-plus/core'

// Change to Pick<CodegenGenerator<O>, 'NAME'> when we implement something here
export function commonGenerator<O extends CodegenOptions>(): Partial<CodegenGenerator<O>> {
	return {

	}
}
