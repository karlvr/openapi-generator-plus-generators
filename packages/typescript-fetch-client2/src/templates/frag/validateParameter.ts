import { CodegenParameter, CodegenRequestBody, CodegenOperation, CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { ts, identifier } from '@openapi-generator-plus/template-utils'

export interface ValidateParameterArgs {
	parameter: CodegenParameter | CodegenRequestBody
	operation: CodegenOperation
	parameterPrefix: string
	generatorContext: CodegenGeneratorContext
}

export function validateParameter({ parameter, operation, parameterPrefix, generatorContext }: ValidateParameterArgs): string {
	if (!parameter.required) {
		return ''
	}
	const name = (parameter as CodegenParameter & CodegenRequestBody).name
	const id = identifier(generatorContext.generator(), name)
	const opId = identifier(generatorContext.generator(), operation.name)
	return ts`// verify required parameter '${id}' is not null or undefined
if (${parameterPrefix}${id} === null || ${parameterPrefix}${id} === undefined) {
	throw new RequiredError('${id}', 'Required parameter ${id} was null or undefined when calling ${opId}.');
}`
}
