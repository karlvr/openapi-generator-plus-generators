import { CodegenOperation, CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { ts, md, indent, each } from '@openapi-generator-plus/template-utils'
import { parameterDocumentation } from './parameterDocumentation'

export function operationDocumentation(generatorContext: CodegenGeneratorContext, op: CodegenOperation): string {
	return ts`/**
${op.description ? indent(md(op.description), ' * ') : null}
${op.externalDocs ? ` * <p>External documentation: ${op.externalDocs.url}</p>` : null}
${op.externalDocs?.description ? indent(md(op.externalDocs.description), ' *   ') : null}
${op.summary ? ` * @summary ${op.summary}` : null}
${each(op.parameters, (p) => indent(parameterDocumentation(generatorContext, p), ' *   '))}
${op.requestBody?.nativeType ? indent(parameterDocumentation(generatorContext, op.requestBody), ' *   ') : null}
 * @param {RequestInit} [options] Override http request option.
 * @param {Configuration} [configuration] Override the default configuration.
 * @throws {RequiredError}
${op.deprecated ? ' * @deprecated' : null}
 */`
}
