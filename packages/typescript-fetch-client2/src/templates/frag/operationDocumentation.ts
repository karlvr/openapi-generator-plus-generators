import { CodegenOperation, CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { ts, md, indent, each, SKIP } from '@openapi-generator-plus/template-utils'
import { parameterDocumentation } from './parameterDocumentation'

export function operationDocumentation(generatorContext: CodegenGeneratorContext, op: CodegenOperation): string {
	return ts`/**
${op.description ? indent(md(op.description), ' * ') : SKIP}
${op.externalDocs ? ` * <p>External documentation: ${op.externalDocs.url}</p>` : SKIP}
${op.externalDocs?.description ? indent(md(op.externalDocs.description), ' *   ') : SKIP}
${op.summary ? ` * @summary ${op.summary}` : SKIP}
${each(op.parameters, (p) => indent(parameterDocumentation(generatorContext, p), ' *   '))}
${op.requestBody?.nativeType ? indent(parameterDocumentation(generatorContext, op.requestBody), ' *   ') : SKIP}
 * @param {RequestInit} [options] Override http request option.
 * @param {Configuration} [configuration] Override the default configuration.
 * @throws {RequiredError}
${op.deprecated ? ' * @deprecated' : SKIP}
 */`
}
