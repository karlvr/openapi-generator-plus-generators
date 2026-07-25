import { CodegenParameter, CodegenRequestBody, CodegenOperation, CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { ts, identifier, SKIP, Skip } from '@openapi-generator-plus/template-utils'

export interface ValidateParameterArgs {
	parameter: CodegenParameter | CodegenRequestBody
	operation: CodegenOperation
	generatorContext: CodegenGeneratorContext
}

/**
 * Render the required-parameter guard for a parameter (or request body): a
 * runtime check that throws {@link RequiredError} if the value is missing.
 * Renders nothing for optional parameters.
 */
export function validateParameter({ parameter, operation, generatorContext }: ValidateParameterArgs): string | Skip {
	if (!parameter.required) {
		return SKIP
	}
	const id = identifier(generatorContext.generator(), parameter.name)
	const opId = identifier(generatorContext.generator(), operation.name)
	return ts`
// verify required parameter '${id}' is not null or undefined
if (${id} === null || ${id} === undefined) {
	throw new RequiredError('${id}', 'Required parameter ${id} was null or undefined when calling ${opId}.');
}`
}
