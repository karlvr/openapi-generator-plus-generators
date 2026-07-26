import { CodegenOperation, CodegenParameter, CodegenRequestBody } from '@openapi-generator-plus/types'
import * as idx from '@openapi-generator-plus/indexed-type'
import { identifier, className, join, joinLines, SKIP, Skip } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from '../types'
import { javax } from '../helpers'
import { parameterAnnotations } from './parameterAnnotations'

/** The options that shape how an operation's parameters and arguments are rendered. */
export interface OperationVarsOptions {
	/** Whether the declaration is for a JAX-RS interface/implementation method (adds parameter annotations, `@BeanParam`). */
	jaxrs: boolean
	/** Whether the declaration is for the API-service layer (delegated to by the JAX-RS implementation). */
	service: boolean
	/**
	 * The expression to use as the request-body argument, overriding the request
	 * body's own identifier — used when the caller has already captured the body
	 * under a different local variable (e.g. a parsed multipart body).
	 */
	requestBodyVar?: string
}

/** Renders the request body's own parameter declaration, honouring the generator's own body-parameter conventions (e.g. multipart handling). */
export type BodyParamRenderer = (requestBody: CodegenRequestBody, opts: OperationVarsOptions, ctx: JavaModelContext) => string

/** The rendered parameter declaration list and matching argument list for an operation's method signature and its delegating call. */
export interface OperationVarsResult {
	parameters: string
	arguments: string
}

/** One parameter's declaration: its Swagger/JAX-RS annotations (if `jaxrs`), then its type and name, all on one line. */
function parameterDeclaration(parameter: CodegenParameter, jaxrs: boolean, ctx: JavaModelContext): string {
	const generator = ctx.generatorContext.generator()
	const annotations = jaxrs ? parameterAnnotations(parameter, ctx) : SKIP
	const declaration = `${parameter.nativeType} ${identifier(generator, parameter.name)}`
	return annotations !== SKIP ? joinLines(`${annotations}\n${declaration}`, ' ') : declaration
}

function parametersList(op: CodegenOperation, opts: OperationVarsOptions, bodyParam: BodyParamRenderer, ctx: JavaModelContext): string | Skip {
	const parts: (string | Skip)[] = []
	if (op.useParamsClasses) {
		const beanParam = opts.jaxrs ? `@${javax(ctx.root.useJakarta)}.ws.rs.BeanParam ` : ''
		parts.push(`${beanParam}${ctx.root.apiParamsPackage}.${className(ctx.generatorContext.generator(), op.uniqueName)}Params params`)
	} else if (op.parameters) {
		for (const parameter of idx.allValues(op.parameters)) {
			parts.push(parameterDeclaration(parameter, opts.jaxrs, ctx))
		}
	}
	if (op.requestBody?.nativeType) {
		parts.push(bodyParam(op.requestBody, opts, ctx))
	}
	return join(parts, ', ')
}

function argumentsList(op: CodegenOperation, opts: OperationVarsOptions, ctx: JavaModelContext): string | Skip {
	const parts: (string | Skip)[] = []
	if (op.useParamsClasses) {
		parts.push('params')
	} else if (op.parameters) {
		const generator = ctx.generatorContext.generator()
		for (const parameter of idx.allValues(op.parameters)) {
			parts.push(identifier(generator, parameter.name))
		}
	}
	if (opts.requestBodyVar !== undefined) {
		parts.push(opts.requestBodyVar)
	} else if (op.requestBody?.nativeType) {
		parts.push(identifier(ctx.generatorContext.generator(), op.requestBody.name))
	}
	return join(parts, ', ')
}

/**
 * An operation's parameter declaration list and matching argument list, for a method
 * signature and the call that delegates to it. `bodyParam` renders the request body's
 * own parameter declaration, honouring whichever generator is calling this (its body
 * parameter conventions, e.g. multipart handling, aren't shared across the family).
 */
export function operationVars(op: CodegenOperation, opts: OperationVarsOptions, bodyParam: BodyParamRenderer, ctx: JavaModelContext): OperationVarsResult {
	const parameters = parametersList(op, opts, bodyParam, ctx)
	const args = argumentsList(op, opts, ctx)
	return {
		parameters: typeof parameters === 'string' ? parameters : '',
		arguments: typeof args === 'string' ? args : '',
	}
}
