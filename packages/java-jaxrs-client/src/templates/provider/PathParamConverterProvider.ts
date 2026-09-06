import { ts } from '@openapi-generator-plus/template-utils'
import { generatedAnnotation, javax, RootContext } from '@openapi-generator-plus/java-jaxrs-generator-common'

/**
 * A JAX-RS `ParamConverterProvider` that percent encodes a string path parameter.
 *
 * The JAX-RS client builds its URI from values that it takes as already encoded. It escapes
 * only what a URI cannot carry at all, so a `/` in a value would add a path segment, and a
 * `?` would start a query. This converter encodes the value first, so it stays inside its
 * own segment.
 *
 * Requires {@link RootContext.apiProviderPackage} to be set, and throws otherwise.
 */
export function pathParamConverterProvider(root: RootContext): string {
	const apiProviderPackage = root.apiProviderPackage
	if (!apiProviderPackage) {
		throw new Error('pathParamConverterProvider requires apiProviderPackage to be set')
	}
	const jx = javax(root.useJakarta)

	return ts`
package ${apiProviderPackage};

/**
 * A {@link ${jx}.ws.rs.ext.ParamConverterProvider} that percent encodes a string path parameter,
 * so that its value stays within one path segment.
 */
${generatedAnnotation(root)}
@${jx}.ws.rs.ext.Provider
public class PathParamConverterProvider implements ${jx}.ws.rs.ext.ParamConverterProvider {

	@java.lang.SuppressWarnings("unchecked")
	@java.lang.Override
	public <T> ${jx}.ws.rs.ext.ParamConverter<T> getConverter(java.lang.Class<T> rawType, java.lang.reflect.Type genericType, java.lang.annotation.Annotation[] annotations) {
		if (rawType != java.lang.String.class || !isPathParam(annotations)) {
			return null;
		}

		return (${jx}.ws.rs.ext.ParamConverter<T>) new ${jx}.ws.rs.ext.ParamConverter<java.lang.String>() {

			@java.lang.Override
			public java.lang.String fromString(java.lang.String value) {
				return value;
			}

			@java.lang.Override
			public java.lang.String toString(java.lang.String value) {
				if (value == null) {
					return null;
				}
				try {
					/* A form encoder writes a space as "+", which a path segment reads as a plus */
					return java.net.URLEncoder.encode(value, "UTF-8").replace("+", "%20");
				} catch (java.io.UnsupportedEncodingException e) {
					throw new java.lang.IllegalStateException(e);
				}
			}

		};
	}

	private static boolean isPathParam(java.lang.annotation.Annotation[] annotations) {
		if (annotations == null) {
			return false;
		}
		for (java.lang.annotation.Annotation annotation : annotations) {
			if (annotation instanceof ${jx}.ws.rs.PathParam) {
				return true;
			}
		}
		return false;
	}

}
`
}
