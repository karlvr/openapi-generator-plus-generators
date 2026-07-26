import { CodegenOperation } from '@openapi-generator-plus/types'
import { ts, identifier, SKIP, Skip } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from '../types'
import { javax } from '../helpers'

/**
 * Validates `operation`'s request body against bean-validation constraints, when it has
 * one. Renders SKIP (dropping the whole block) when the operation has no request body.
 */
export function beanValidationValidateParams(operation: CodegenOperation, ctx: JavaModelContext): string | Skip {
	const requestBody = operation.requestBody
	if (!requestBody || !requestBody.nativeType) {
		return SKIP
	}

	const jx = javax(ctx.root.useJakarta)
	const name = identifier(ctx.generatorContext.generator(), requestBody.name)

	const closing = requestBody.required
		? ts`
} else {
	${ctx.templates.beanValidationRequestBodyMissing(operation, ctx)}
}`
		: '}'

	return ts`
if (${name} != null) {
	java.util.Set<${jx}.validation.ConstraintViolation<${requestBody.nativeType}>> __validations = this.validatorFactory.getValidator().validate(${name}, ${ctx.root.validationPackage}.Request.class);
	if (!__validations.isEmpty()) {
		${ctx.templates.beanValidationViolation(operation, ctx)}
	}
${closing}

`
}
