import { ts } from '@openapi-generator-plus/template-utils'
import { generatedAnnotation } from '../generatedAnnotation'
import { RootContext } from '../types'

/** The simple name of the class that {@link formEncoding} renders. */
export const FORM_ENCODING_CLASS = 'FormEncoding'

/**
 * The generated support class that gives the text form of a value, and joins a collection of
 * values into one text.
 *
 * Use this when generated code encodes a value as text itself, such as a form body that
 * applies the styles that the API declares. Emit it into the support package, and refer to
 * its methods through {@link FORM_ENCODING_CLASS}.
 */
export function formEncoding(root: RootContext): string {
	return ts`
package ${root.supportPackage};

/**
 * The text form of the values that a request carries.
 * <p>
 * A null value becomes empty text, so that it stays apart from an absent value.
 */
${generatedAnnotation(root)}
public final class ${FORM_ENCODING_CLASS} {

	private ${FORM_ENCODING_CLASS}() {

	}

	/**
	 * The text form of a value, which is empty for null.
	 *
	 * Text has no null. An empty value stands for it, and keeps it apart from an absent value,
	 * which is left out.
	 */
	public static java.lang.String text(java.lang.Object value) {
		return value != null ? java.lang.String.valueOf(value) : "";
	}

	/** The elements of {@code values}, in their text form, with {@code separator} between them. */
	public static java.lang.String join(java.lang.Iterable<?> values, java.lang.String separator) {
		java.lang.StringBuilder result = new java.lang.StringBuilder();
		boolean first = true;
		for (java.lang.Object value : values) {
			if (!first) {
				result.append(separator);
			}
			result.append(text(value));
			first = false;
		}
		return result.toString();
	}

	/** The elements of {@code values}, in their text form, with {@code separator} between them. */
	public static java.lang.String join(${root.supportPackage}.NoExplodeCollection<?> values, java.lang.String separator) {
		return join(values.stream().collect(java.util.stream.Collectors.toList()), separator);
	}

}
`
}
