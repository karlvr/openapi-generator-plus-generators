import { ts, indentTail } from '@openapi-generator-plus/template-utils'
import { JavaModelContext } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { ClientRootContext } from '@openapi-generator-plus/java-jaxrs-client-generator'

/**
 * This client's extra `ApiConstants` members: the default connect and receive timeouts used to
 * construct a client instance (see `apiImplClassBody`'s constructors).
 */
export function apiConstantsBody(ctx: JavaModelContext): string {
	const root = ctx.root as ClientRootContext

	const body = ts`
/**
 * The default length of time to wait to connect to the API before throwing
 * an {@link UnexpectedTimeoutException}
 */
long DEFAULT_CONNECTION_TIMEOUT_MILLIS = ${String(root.connectionTimeoutMillis)}L;

/**
 * The default length of time to wait for a response from the API before
 * throwing an {@link UnexpectedTimeoutException}.
 */
long DEFAULT_RECEIVE_TIMEOUT_MILLIS = ${String(root.receiveTimeoutMillis)}L;`

	/*
	 * `ApiConstants.ts` splices this hook's output via a plain (non-`ts`-tagged) template
	 * literal at one tab of indentation (to avoid doubling up the blank line the
	 * server-constants block above it already ends in), appending its own single trailing
	 * newline — so this ends with no trailing newline of its own (matching no blank line
	 * before the interface's closing brace), and every line here must carry its own indent
	 * rather than relying on `ts`'s alone-on-line auto-indent.
	 */
	return indentTail(body, '\t')
}
