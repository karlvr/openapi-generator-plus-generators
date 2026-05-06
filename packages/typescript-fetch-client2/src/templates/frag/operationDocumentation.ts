import { CodegenOperation, CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { ts, md, indent, each, when, maybe } from '@openapi-generator-plus/template-utils'
import { parameterDocumentation } from './parameterDocumentation'

export function operationDocumentation(generatorContext: CodegenGeneratorContext, op: CodegenOperation): string {
	return ts`/**
${maybe(op.description, d => indent(md(d), ' * '))}
${maybe(op.externalDocs, ed => ` * <p>External documentation: ${ed.url}</p>`)}
${maybe(op.externalDocs?.description, d => indent(md(d), ' *   '))}
${maybe(op.summary, s => ` * @summary ${s}`)}
${each(op.parameters, (p) => indent(parameterDocumentation(generatorContext, p), ' *   '))}
${when(op.requestBody?.nativeType, () => indent(parameterDocumentation(generatorContext, op.requestBody!), ' *   '))}
 * @param {RequestInit} [options] Override http request option.
 * @param {Configuration} [configuration] Override the default configuration.
 * @throws {RequiredError}
${when(op.deprecated, ' * @deprecated')}
 */`
}
