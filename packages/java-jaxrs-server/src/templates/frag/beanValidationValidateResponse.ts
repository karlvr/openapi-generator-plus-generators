import { CodegenSchema } from '@openapi-generator-plus/types'
import { ts } from '@openapi-generator-plus/template-utils'
import { javax } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { ServerContext } from '../types'
import { MyResponse } from '../../internal-types'

/**
 * Validates `response`'s body (held in `responseVar`) against bean-validation
 * constraints, calling the `beanValidationResponseViolation`/`beanValidationResponseMissing`
 * hooks when validation finds a problem.
 */
export function beanValidationValidateResponse(responseVar: string, schema: CodegenSchema, response: MyResponse, ctx: ServerContext): string {
	const jx = javax(ctx.root.useJakarta)
	const componentType = response.__wrapper?.bodyNativeType ?? response.defaultContent?.nativeType?.componentType
	const validationsDecl = `java.util.Set<${jx}.validation.ConstraintViolation<${componentType}>> __validations = this.validatorFactory.getValidator().validate(${responseVar}, ${ctx.root.validationPackage}.Response.class);`

	if (schema.nullable) {
		return ts`
if (${responseVar} != null) {
	${validationsDecl}
	if (!__validations.isEmpty()) {
		${ctx.templates.beanValidationResponseViolation(response, ctx)}
	}
} else {
	${ctx.templates.beanValidationResponseMissing(response, ctx)}
}`
	} else {
		return ts`
${validationsDecl}
if (!__validations.isEmpty()) {
	${ctx.templates.beanValidationResponseViolation(response, ctx)}
}`
	}
}
