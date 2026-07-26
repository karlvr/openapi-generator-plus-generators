import { CodegenSecurityScheme } from '@openapi-generator-plus/types'
import { ts, each, capitalize, className, identifier, stringLiteral, Skip } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from '@openapi-generator-plus/java-jaxrs-generator-common'

/**
 * The suffix this security scheme contributes to the method and field names derived from it —
 * blank when it's the document's only security scheme (so those names stay unadorned, e.g.
 * `authorize`/`getAuthorization`), otherwise its class-cased name (so multiple schemes get
 * distinctly named methods and fields, e.g. `authorizeAltOAuth`/`getAltOAuthAuthorization`).
 */
function schemeSuffix(scheme: CodegenSecurityScheme, schemes: CodegenSecurityScheme[], ctx: JavaModelContext): string {
	return schemes.length === 1 ? '' : className(ctx.generatorContext.generator(), scheme.name)
}

/** One security scheme's instance field(s) holding its current authorization value. */
function securityField(scheme: CodegenSecurityScheme, ctx: JavaModelContext): string {
	const generator = ctx.generatorContext.generator()
	const name = identifier(generator, scheme.name)

	if (scheme.type === 'http' && scheme.scheme === 'basic') {
		return ts`
private java.lang.String ${name}Username;
private java.lang.String ${name}Password;`
	}

	return `private java.lang.String ${name}Authorization;`
}

/**
 * Every configured security scheme's instance field(s), in the order they're declared in the
 * API document. Used by {@link apiImplClassBody}'s field declarations.
 */
export function securityFields(ctx: JavaModelContext): string | Skip {
	return each(ctx.root.securitySchemes, s => securityField(s, ctx), '\n')
}

/** One security scheme's `authorize*`/`get*Authorization` method(s) on the generated API implementation class. */
function securityImplMethods(scheme: CodegenSecurityScheme, suffix: string, ctx: JavaModelContext): string {
	const generator = ctx.generatorContext.generator()
	const name = identifier(generator, scheme.name)

	if (scheme.type === 'apiKey') {
		const assign = scheme.in === 'header'
			? `client.header(${stringLiteral(ctx.generatorContext, scheme.paramName)}, apiKeyValue);`
			: scheme.in === 'cookie'
				? `client.cookie(new javax.ws.rs.core.Cookie(${stringLiteral(ctx.generatorContext, scheme.paramName)}, apiKeyValue));`
				: `client.query(${stringLiteral(ctx.generatorContext, scheme.paramName)}, apiKeyValue);`

		/* Unlike the other scheme types below, the `authorize*` method here has no `@Override` —
		   matching the original template exactly. */
		return ts`
public void authorize${suffix}(java.lang.String apiKeyValue) {
	this.${name}Authorization = apiKeyValue;
	${assign}
}

@java.lang.Override
public java.lang.String get${suffix}Authorization() {
	return ${name}Authorization;
}

`
	}

	if (scheme.type === 'http' && scheme.scheme === 'basic') {
		/* The username/password getters fall back to "Authorization" (rather than the blank
		   suffix) when there's only one scheme, so they read `getAuthorizationUsername` /
		   `getAuthorizationPassword` instead of the (misleadingly bodiless) `getUsername` /
		   `getPassword` — matching the original template exactly. */
		const usernamePasswordSuffix = suffix || 'Authorization'
		return ts`
public void authorize${suffix}(java.lang.String username, java.lang.String password) {
	this.${name}Username = username;
	this.${name}Password = password;
	client.authorization("Basic " + java.util.Base64.getEncoder().encodeToString((username + ":" + password).getBytes(java.nio.charset.StandardCharsets.UTF_8)));
}

@java.lang.Override
public java.lang.String get${usernamePasswordSuffix}Username() {
	return ${name}Username;
}

@java.lang.Override
public java.lang.String get${usernamePasswordSuffix}Password() {
	return ${name}Password;
}

`
	}

	if (scheme.type === 'http') {
		const prefix = stringLiteral(ctx.generatorContext, `${capitalize(scheme.scheme ?? '')} `)
		return ts`
@java.lang.Override
public void authorize${suffix}(java.lang.String value) {
	this.${name}Authorization = value;
	client.authorization(${prefix} + value);
}

@java.lang.Override
public java.lang.String get${suffix}Authorization() {
	return ${name}Authorization;
}

`
	}

	/* oauth2 / openIdConnect */
	return ts`
@java.lang.Override
public void authorize${suffix}(java.lang.String bearerToken) {
	this.${name}Authorization = bearerToken;
	client.authorization("Bearer " + bearerToken);
}

@java.lang.Override
public java.lang.String get${suffix}Authorization() {
	return ${name}Authorization;
}

`
}

/**
 * Every configured security scheme's `authorize*`/`get*Authorization` method(s), implementing
 * the matching {@link securityInvokerBody} interface declarations. Used by
 * `apiImplClassBody`.
 */
export function securityImplBody(ctx: JavaModelContext): string | Skip {
	const schemes = ctx.root.securitySchemes ?? []
	return each(schemes, s => securityImplMethods(s, schemeSuffix(s, schemes, ctx), ctx), '')
}

/** One security scheme's `authorize*`/`get*Authorization` method declaration(s) on the `ApiInvoker` interface. */
function securityInvokerMethods(scheme: CodegenSecurityScheme, suffix: string): string {
	const name = scheme.name

	if (scheme.type === 'apiKey') {
		return ts`
/**
 * Authorize requests using an API key for the security scheme "${name}"
 */
void authorize${suffix}(java.lang.String apiKeyValue);

/**
 * Returns the API key used to authorize requests for the security scheme "${name}".
 */
java.lang.String get${suffix}Authorization();

`
	}

	if (scheme.type === 'http' && scheme.scheme === 'basic') {
		const usernamePasswordSuffix = suffix || 'Authorization'
		return ts`
/**
 * Authorize requests using HTTP Basic authorization for the security scheme "${name}".
 */
void authorize${suffix}(java.lang.String username, java.lang.String password);

/**
 * Returns the username used to authorize requests for the security scheme "${name}".
 */
java.lang.String get${usernamePasswordSuffix}Username();

/**
 * Returns the password used to authorize requests for the security scheme "${name}".
 */
java.lang.String get${usernamePasswordSuffix}Password();

`
	}

	if (scheme.type === 'http') {
		return ts`
/**
 * Authorize requests using ${scheme.scheme ?? ''} authorization for the security scheme "${name}".
 */
void authorize${suffix}(java.lang.String value);

/**
 * Returns the value used to authorize requests for the security scheme "${name}".
 */
java.lang.String get${suffix}Authorization();

`
	}

	/* oauth2 / openIdConnect */
	return ts`
/**
 * Authorize requests using an OAuth2 Bearer token value for the security scheme "${name}".
 */
void authorize${suffix}(java.lang.String bearerToken);

/**
 * Returns the OAuth2 Bearer token value used to authorize requests for the security scheme "${name}".
 */
java.lang.String get${suffix}Authorization();

`
}

/** Every configured security scheme's `ApiInvoker` interface method declarations. Used by `apiInvokerInterfaceBody`. */
export function securityInvokerBody(ctx: JavaModelContext): string | Skip {
	const schemes = ctx.root.securitySchemes ?? []
	return each(schemes, s => securityInvokerMethods(s, schemeSuffix(s, schemes, ctx)), '')
}
