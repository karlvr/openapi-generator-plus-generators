import { CodegenOperation, CodegenGeneratorContext } from '@openapi-generator-plus/types'
import { ts, each, capitalize, stringLiteral } from '@openapi-generator-plus/template-utils'

interface SecurityScheme {
	name: string
	scheme?: string
	paramName: string
	isApiKey?: boolean
	isInHeader?: boolean
	isInQuery?: boolean
	isBasic?: boolean
	isOAuth?: boolean
	isOpenIdConnect?: boolean
	isHttp?: boolean
}

interface SecurityRequirementScheme {
	scheme: SecurityScheme
	scopes?: Array<{ name: string }>
}

interface SecurityRequirement {
	schemes: SecurityRequirementScheme[]
}

interface SecurityRequirements {
	requirements: SecurityRequirement[]
}

/**
 * Render the auth-injection block for an API operation. Emits one chunk per
 * scheme per requirement.
 */
export function apiSecurityRequirements(generatorContext: CodegenGeneratorContext, op: CodegenOperation): string {
	const sr = (op as CodegenOperation & { securityRequirements: SecurityRequirements | null }).securityRequirements
	if (!sr) {
		return ''
	}
	return each(sr.requirements, (req) => {
		return each(req.schemes, ({ scheme, scopes }) => renderScheme(generatorContext, scheme, scopes ?? []), '\n')
	}, '\n')
}

function renderScheme(generatorContext: CodegenGeneratorContext, scheme: SecurityScheme, scopes: Array<{ name: string }>): string {
	const lines: string[] = [`// authentication ${scheme.name} required`]
	if (scheme.isApiKey) {
		if (scheme.isInHeader) {
			lines.push(ts`if (configuration && configuration.apiKey) {
	const localVarApiKeyValue = typeof configuration.apiKey === 'function'
		? configuration.apiKey(${stringLiteral(generatorContext, scheme.name)})
		: configuration.apiKey;
	if (localVarApiKeyValue !== null) {
		localVarHeaderParameter.set(${stringLiteral(generatorContext, scheme.paramName)}, localVarApiKeyValue);
	}
}`)
		}
		if (scheme.isInQuery) {
			lines.push(ts`if (configuration && configuration.apiKey) {
	const localVarApiKeyValue = typeof configuration.apiKey === 'function'
		? configuration.apiKey(${stringLiteral(generatorContext, scheme.name)})
		: configuration.apiKey;
	if (localVarApiKeyValue !== null) {
		localVarQueryParameter.set(${stringLiteral(generatorContext, scheme.paramName)}, localVarApiKeyValue);
	}
}`)
		}
	}
	if (scheme.isBasic) {
		lines.push(ts`// http basic authentication required
if (configuration && (configuration.username || configuration.password)) {
	localVarHeaderParameter.set("Authorization", "Basic " + btoa(configuration.username + ":" + configuration.password));
}`)
	}
	if (scheme.isOAuth || scheme.isOpenIdConnect) {
		const scopeArgs = scopes.map(s => stringLiteral(generatorContext, s.name)).join(', ')
		lines.push(ts`// oauth or openIdConnect required
if (configuration && configuration.authorization) {
	const localVarAuthorizationValue = typeof configuration.authorization === 'function'
		? configuration.authorization(${stringLiteral(generatorContext, scheme.name)}, [${scopeArgs}])
		: configuration.authorization;
	if (localVarAuthorizationValue !== null) {
		localVarHeaderParameter.set("Authorization", "Bearer " + localVarAuthorizationValue);
	}
}`)
	}
	if (scheme.isHttp) {
		lines.push(ts`// http authorization required
if (configuration && configuration.authorization) {
	const localVarAuthorizationValue = typeof configuration.authorization === 'function'
		? configuration.authorization(${stringLiteral(generatorContext, scheme.name)})
		: configuration.authorization;
	if (localVarAuthorizationValue !== null) {
		localVarHeaderParameter.set("Authorization", "${capitalize(scheme.scheme)} " + localVarAuthorizationValue);
	}
}`)
	}
	return lines.join('\n')
}
