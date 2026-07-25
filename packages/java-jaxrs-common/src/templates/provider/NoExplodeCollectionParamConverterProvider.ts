import { ts } from '@openapi-generator-plus/template-utils'
import { RootContext } from '../types'
import { generatedAnnotation } from '../generatedAnnotation'
import { javax } from '../helpers'

/**
 * A JAX-RS `ParamConverterProvider` that converts `NoExplodeList`/`NoExplodeSet`
 * parameters to and from their string representation.
 *
 * Requires {@link RootContext.apiProviderPackage} to be set; the caller only
 * emits this file when that's the case.
 */
export function noExplodeCollectionParamConverterProvider(root: RootContext): string {
	const apiProviderPackage = root.apiProviderPackage
	if (!apiProviderPackage) {
		throw new Error('noExplodeCollectionParamConverterProvider requires apiProviderPackage to be set')
	}
	const jx = javax(root.useJakarta)
	const support = root.supportPackage

	return ts`
package ${apiProviderPackage};

/**
 * A {@link ${jx}.ws.rs.ext.ParamConverterProvider} that converts {@link ${support}.NoExplodeList}s
 * and {@link ${support}.NoExplodeSet}s to and from string representations.
 */
${generatedAnnotation(root)}
@${jx}.ws.rs.ext.Provider
public class NoExplodeCollectionParamConverterProvider implements ${jx}.ws.rs.ext.ParamConverterProvider {

	@SuppressWarnings("unchecked")
	@java.lang.Override
	public <T> ${jx}.ws.rs.ext.ParamConverter<T> getConverter(java.lang.Class<T> rawType, java.lang.reflect.Type genericType, java.lang.annotation.Annotation[] annotations) {
		if (rawType == ${support}.NoExplodeList.class || rawType == ${support}.NoExplodeSet.class) {
			return (${jx}.ws.rs.ext.ParamConverter<T>) new ${jx}.ws.rs.ext.ParamConverter<${support}.NoExplodeCollection<?>>() {

				@java.lang.Override
				public ${support}.NoExplodeCollection<?> fromString(java.lang.String value) {
					java.lang.String[] values = value.split(",");
					${support}.NoExplodeCollection<T> result;
					try {
						result = (${support}.NoExplodeCollection<T>) rawType.getDeclaredConstructor().newInstance();
					} catch (java.lang.InstantiationException | java.lang.IllegalAccessException | java.lang.IllegalArgumentException | java.lang.NoSuchMethodException | java.lang.SecurityException e) {
						throw new java.lang.IllegalStateException(e);
					} catch (java.lang.reflect.InvocationTargetException e) {
						throw new java.lang.IllegalStateException(e.getCause());
					}
					result.addAll(java.util.stream.Stream.of(values).map(string -> {
						return convertFromString(string, rawType);
					}).collect(java.util.stream.Collectors.toList()));
					return result;
				}

				@java.lang.Override
				public java.lang.String toString(${support}.NoExplodeCollection<?> collection) {
					return collection.stream()
						.map(java.lang.Object::toString)
						.collect(java.util.stream.Collectors.joining(","))
						;
				}

			};
		} else {
			return null;
		}
	}

	@java.lang.SuppressWarnings("unchecked")
	private <T> T convertFromString(java.lang.String value, java.lang.Class<T> rawType) {
		if (value == null) {
			return null;
		}

		java.lang.Exception latestException = null;

		/* Look for a static valueOf(String) method. */
		try {
			java.lang.reflect.Constructor<? extends T> constructor = rawType.getConstructor(new Class<?>[] { java.lang.String.class });
			return constructor.newInstance(new java.lang.Object[] { value });
		} catch (NoSuchMethodException e) {

		} catch (java.lang.SecurityException e) {
			latestException = e;
		} catch (java.lang.InstantiationException e) {
			latestException = e;
		} catch (java.lang.IllegalAccessException e) {
			latestException = e;
		} catch (java.lang.IllegalArgumentException e) {
			latestException = e;
		} catch (java.lang.reflect.InvocationTargetException e) {
			throw new java.lang.RuntimeException("Cannot convert to string: " + rawType.getName(), e.getTargetException());
		}

		/* Look for a static valueOf(String) method. */
		try {
			java.lang.reflect.Method valueOf = rawType.getMethod("valueOf", new java.lang.Class<?>[] { java.lang.String.class });
			return (T) valueOf.invoke(null, new java.lang.Object[] { value });
		} catch (java.lang.NoSuchMethodException e) {

		} catch (java.lang.SecurityException e) {
			latestException = e;
		} catch (java.lang.IllegalAccessException e) {
			latestException = e;
		} catch (java.lang.reflect.InvocationTargetException e) {
			throw new java.lang.RuntimeException("Cannot convert to string: " + rawType.getName(), e.getTargetException());
		}

		/* Look for a static parse(CharSequence) method, e.g. the Java 8 LocalDate, etc classes. */
		try {
			java.lang.reflect.Method valueOf = rawType.getMethod("parse", new java.lang.Class<?>[] { java.lang.CharSequence.class });
			return (T) valueOf.invoke(null, new java.lang.Object[] { value });
		} catch (NoSuchMethodException e) {

		} catch (java.lang.SecurityException e) {
			latestException = e;
		} catch (java.lang.IllegalAccessException e) {
			latestException = e;
		} catch (java.lang.reflect.InvocationTargetException e) {
			throw new java.lang.RuntimeException("Cannot convert to string: " + rawType.getName(), e.getTargetException());
		}

		if (latestException != null) {
			throw new java.lang.RuntimeException("Cannot convert to string: " + rawType.getName(), latestException);
		} else {
			throw new java.lang.RuntimeException("Cannot convert to string: " + rawType.getName());
		}
	}

}
`
}
