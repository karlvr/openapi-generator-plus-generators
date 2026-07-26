import { CodegenOperation } from '@openapi-generator-plus/types'
import { operationVars, OperationVarsResult } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { ServerContext } from '../types'
import { bodyParam } from './bodyParam'

/** An operation's parameter declaration list and matching argument list for the API-service layer. */
export function operationServiceVars(op: CodegenOperation, ctx: ServerContext): OperationVarsResult {
	return operationVars(op, { jaxrs: false, service: true }, bodyParam, ctx)
}
