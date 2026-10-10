import { ts } from '@openapi-generator-plus/template-utils'
import { generatedAnnotation, javax } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { ClientRootContext } from './types'

/** The simple name of the class that {@link responseHeadersClass} renders. */
export const RESPONSE_HEADERS_CLASS = 'ResponseHeaders'

/**
 * The generated support class that reads a declared response header as the type that the API
 * gives it.
 *
 * Emit it into the API implementation package, and refer to it through
 * {@link RESPONSE_HEADERS_CLASS}.
 */
export function responseHeadersClass(root: ClientRootContext): string {
	const jx = javax(root.useJakarta)
	const unprocessable = `${root.apiPackage}.UnprocessableResponseException`

	return ts`
package ${root.apiImplPackage};

/**
 * Reads the headers that the API declares on a response, as the types that the API gives them.
 * <p>
 * A required header that is absent, or a value that does not parse, breaks the contract that the
 * API states. Each method reports that as an {@link ${unprocessable}}.
 */
${generatedAnnotation(root)}
public final class ${RESPONSE_HEADERS_CLASS} {

	private ${RESPONSE_HEADERS_CLASS}() {

	}

	/**
	 * The value of the header {@code name}, read by {@code parser}.
	 *
	 * @return the value, or null when the header is not required and the response does not carry it
	 * @throws ${unprocessable} when the header is required and absent, or when {@code parser} cannot read it
	 */
	public static <T> T read(${jx}.ws.rs.core.Response response, java.lang.String name, boolean required, java.util.function.Function<java.lang.String, T> parser) throws ${unprocessable} {
		java.lang.String value = text(response, name, required);
		return value != null ? parse(response, name, value, parser) : null;
	}

	/**
	 * The elements of the header {@code name}, each read by {@code parser}, in a collection from
	 * {@code collection}.
	 * <p>
	 * The elements are separated by commas, which may have whitespace around them. A response
	 * that carries the header on more than one line gives the elements of every line.
	 *
	 * @return the elements, or null when the header is not required and the response does not carry it
	 * @throws ${unprocessable} when the header is required and absent, or when {@code parser} cannot read an element
	 */
	public static <T, C extends java.util.Collection<T>> C readCollection(${jx}.ws.rs.core.Response response, java.lang.String name, boolean required, java.util.function.Supplier<C> collection, java.util.function.Function<java.lang.String, T> parser) throws ${unprocessable} {
		java.lang.String value = text(response, name, required);
		if (value == null) {
			return null;
		}

		C result = collection.get();
		java.lang.String trimmed = value.trim();
		if (!trimmed.isEmpty()) {
			for (java.lang.String element : trimmed.split("\\\\s*,\\\\s*", -1)) {
				result.add(parse(response, name, element, parser));
			}
		}
		return result;
	}

	/** The text of the header {@code name}, or null when it is not required and absent. */
	private static java.lang.String text(${jx}.ws.rs.core.Response response, java.lang.String name, boolean required) throws ${unprocessable} {
		java.lang.String value = response.getHeaderString(name);
		if (value == null && required) {
			throw new ${unprocessable}(response, new ${jx}.ws.rs.ProcessingException("No " + name + " header for response status " + response.getStatus() + ", which requires it"));
		}
		return value;
	}

	/** {@code value}, read by {@code parser}. */
	private static <T> T parse(${jx}.ws.rs.core.Response response, java.lang.String name, java.lang.String value, java.util.function.Function<java.lang.String, T> parser) throws ${unprocessable} {
		try {
			return parser.apply(value);
		} catch (java.lang.RuntimeException e) {
			throw new ${unprocessable}(response, new ${jx}.ws.rs.ProcessingException("Cannot read the " + name + " header \\"" + value + "\\"", e));
		}
	}

}
`
}
