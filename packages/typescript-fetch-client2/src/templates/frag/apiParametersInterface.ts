import { CodegenOperation, CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { ts, each, className, maybe } from '@openapi-generator-plus/template-utils'
import { propertyDocumentation } from './propertyDocumentation'
import { CodegenProperty } from '@openapi-generator-plus/types'

export function apiParametersInterface(generatorContext: CodegenGeneratorContext, op: CodegenOperation): string {
	const interfaceName = className(generatorContext.generator(), `${op.name}_parameters`)
	return ts`export interface ${interfaceName} {
${each(op.parameters, (p) => {
	/* The parameter doc helper expects a property; we synthesise minimal fields. */
	const doc = propertyDocumentation({
		property: p as unknown as CodegenProperty,
		memberOf: null,
		generatorContext,
	})
	const optional = p.required ? '' : '?'
	return ts`	${maybe(doc)}
	${p.name}${optional}: ${p.nativeType}`
}, '\n')}
}`
}
