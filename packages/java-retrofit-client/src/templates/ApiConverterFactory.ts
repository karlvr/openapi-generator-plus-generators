import { CodegenContentEncodingType, CodegenOperation, CodegenOperationGroup, CodegenRequestBody } from '@openapi-generator-plus/types'
import { ts, className, indent, stringLiteral } from '@openapi-generator-plus/template-utils'
import { FORM, FORM_ENCODING_CLASS, FormBodyBuilder, formBodyStatements, generatedAnnotation, JavaModelContext } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { multipartBodyStatements } from './frag/multipartBody'

/** How OkHttp builds an `application/x-www-form-urlencoded` body. */
function okHttpForm(ctx: JavaModelContext): FormBodyBuilder {
	const support = `${ctx.root.supportPackage}.${FORM_ENCODING_CLASS}`
	return {
		declare: `okhttp3.FormBody.Builder ${FORM} = new okhttp3.FormBody.Builder();\n`,
		add: (name, value) => `${FORM}.add(${name}, ${value});\n`,
		finish: `return ${FORM}.build();\n`,
		text: (value) => `${support}.text(${value})`,
		join: (values, separator) => `${support}.join(${values}, ${separator})`,
	}
}

/** The variable that holds the request model that an encoder reads. */
const MODEL = '__value'

/** The simple name of the parameter annotation that names the encoding of one request body. */
const ENCODING_ANNOTATION = 'Encoding'

/**
 * A request body whose content this generator encodes itself: a form body or a multipart body.
 *
 * Retrofit describes a request with annotations alone, and has no annotation for the encoding
 * styles that OpenAPI declares. So the whole body goes through one converter.
 *
 * Each operation declares its own encoding, even for a request model that another operation
 * also sends. So the converter selects the encoding by the operation, not by the Java type.
 */
export interface EncodedRequestBody {
	/** The name that identifies the operation's encoding. It is unique in the document. */
	id: string
	/** The Java type of the request model. */
	type: string
	/** The request body that declares the content. */
	requestBody: CodegenRequestBody
}

/** Whether this generator encodes `requestBody` itself, rather than leaving it to the JSON converter. */
function isEncoded(requestBody: CodegenRequestBody | null): requestBody is CodegenRequestBody {
	return !!requestBody && !!requestBody.nativeType && !!requestBody.defaultContent.encoding
}

/**
 * The annotation that selects the encoding of the operation's request body, or null when this
 * generator does not encode that body itself.
 *
 * Put the annotation on the `@Body` parameter. Retrofit ignores an annotation that it does not
 * know, and gives it to the converter factory.
 */
export function encodingAnnotation(operation: CodegenOperation, ctx: JavaModelContext): string | null {
	if (!isEncoded(operation.requestBody)) {
		return null
	}
	return `@${ctx.root.apiPackage}.ApiConverterFactory.${ENCODING_ANNOTATION}(${stringLiteral(ctx.generatorContext, operation.uniqueName)})`
}

/** Every request body in the document that this generator encodes itself, once for each operation. */
export function encodedRequestBodies(groups: CodegenOperationGroup[]): EncodedRequestBody[] {
	const result: EncodedRequestBody[] = []
	for (const group of groups) {
		for (const operation of group.operations) {
			const requestBody = operation.requestBody
			if (isEncoded(requestBody)) {
				result.push({ id: operation.uniqueName, type: String(requestBody.nativeType), requestBody })
			}
		}
	}
	return result
}

/** The name of the method that encodes one request body. */
function encoderName(body: EncodedRequestBody, ctx: JavaModelContext): string {
	return `encode${className(ctx.generatorContext.generator(), body.id)}`
}

/** The statements that encode one request body. */
function encoderStatements(body: EncodedRequestBody, ctx: JavaModelContext): string {
	const encoding = body.requestBody.defaultContent.encoding
	if (encoding?.type === CodegenContentEncodingType.MULTIPART) {
		return multipartBodyStatements(body.requestBody, MODEL, ctx)
	}
	return formBodyStatements(body.requestBody, MODEL, okHttpForm(ctx), ctx)
}

/** The method that encodes one request body. */
function encoder(body: EncodedRequestBody, ctx: JavaModelContext): string {
	const mimeType = body.requestBody.defaultContent.mediaType.mimeType
	return `\t/** The {@code ${mimeType}} body that holds {@code ${body.type}}. */\n`
		+ `\tprivate okhttp3.RequestBody ${encoderName(body, ctx)}(${body.type} ${MODEL}) throws java.io.IOException {\n`
		+ indent(encoderStatements(body, ctx), '\t\t')
		+ '\t}\n'
}

/** The branch of `requestBodyConverter` that answers for one request body. */
function converterBranch(body: EncodedRequestBody, ctx: JavaModelContext): string {
	const converter = `new retrofit2.Converter<${body.type}, okhttp3.RequestBody>() {\n`
		+ '\t@java.lang.Override\n'
		+ `\tpublic okhttp3.RequestBody convert(${body.type} ${MODEL}) throws java.io.IOException {\n`
		+ `\t\treturn ${encoderName(body, ctx)}(${MODEL});\n`
		+ '\t}\n'
		+ '}'
	return `if (${stringLiteral(ctx.generatorContext, body.id)}.equals(encoding)) {\n\treturn ${indent(converter, '\t').trimStart()};\n}\n`
}

/**
 * The generated `ApiConverterFactory` class: the Retrofit converters that this API needs.
 *
 * Retrofit turns a value into text, and a request model into a request body, through the
 * converter factories that the caller registers. This factory holds the conversions that the
 * API's own encoding declares, which Retrofit's annotations cannot express.
 */
export function apiConverterFactory(bodies: EncodedRequestBody[], ctx: JavaModelContext): string {
	const root = ctx.root
	const noExplode = `${root.supportPackage}.NoExplodeCollection`
	const branches = bodies.map(body => converterBranch(body, ctx)).join('')
	const encoders = bodies.map(body => encoder(body, ctx)).join('\n')

	return ts`
package ${root.apiPackage};

/**
 * The Retrofit converters that this API needs.
 * <p>
 * Register this factory before any other, so that it answers for the request models that it
 * knows, and leaves the rest to the factory that reads and writes JSON:
 * <pre>
 * com.fasterxml.jackson.databind.ObjectMapper mapper = ${root.apiPackage}.ApiObjectMapper.create();
 * retrofit2.Retrofit retrofit = new retrofit2.Retrofit.Builder()
 *     .baseUrl(${root.apiPackage}.ApiConstants.DEFAULT_SERVER + "/")
 *     .addConverterFactory(new ${root.apiPackage}.ApiConverterFactory(mapper))
 *     .addConverterFactory(retrofit2.converter.jackson.JacksonConverterFactory.create(mapper))
 *     .build();
 * </pre>
 * Retrofit requires the base URL to end with "/".
 */
${generatedAnnotation(root)}
public class ApiConverterFactory extends retrofit2.Converter.Factory {

	private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

	/** A factory that writes JSON with the configuration that this API's models expect. */
	public ApiConverterFactory() {
		this(${root.apiPackage}.ApiObjectMapper.create());
	}

	/**
	 * A factory that writes JSON with {@code objectMapper}.
	 *
	 * @param objectMapper the mapper that writes a JSON multipart part
	 */
	public ApiConverterFactory(com.fasterxml.jackson.databind.ObjectMapper objectMapper) {
		this.objectMapper = objectMapper;
	}

	@java.lang.Override
	public retrofit2.Converter<?, java.lang.String> stringConverter(java.lang.reflect.Type type, java.lang.annotation.Annotation[] annotations, retrofit2.Retrofit retrofit) {
		java.lang.Class<?> raw = rawType(type);
		if (raw != null && ${noExplode}.class.isAssignableFrom(raw)) {
			/* A parameter that does not explode writes one value, with a comma between its elements */
			return new retrofit2.Converter<${noExplode}<?>, java.lang.String>() {
				@java.lang.Override
				public java.lang.String convert(${noExplode}<?> value) {
					return ${root.supportPackage}.${FORM_ENCODING_CLASS}.join(value, ",");
				}
			};
		}
		return null;
	}

	/**
	 * The encoding that an operation declares for its request body.
	 * <p>
	 * Each operation declares its own encoding, even for a request model that another operation
	 * also sends. So the factory selects the encoding by this name, and not by the type of the
	 * model. A body without this annotation goes to the next factory.
	 */
	@java.lang.annotation.Retention(java.lang.annotation.RetentionPolicy.RUNTIME)
	@java.lang.annotation.Target(java.lang.annotation.ElementType.PARAMETER)
	public @interface ${ENCODING_ANNOTATION} {

		/** The name of the operation that declares the encoding. */
		java.lang.String value();

	}

	@java.lang.Override
	public retrofit2.Converter<?, okhttp3.RequestBody> requestBodyConverter(java.lang.reflect.Type type, java.lang.annotation.Annotation[] parameterAnnotations, java.lang.annotation.Annotation[] methodAnnotations, retrofit2.Retrofit retrofit) {
		java.lang.String encoding = null;
		for (java.lang.annotation.Annotation annotation : parameterAnnotations) {
			if (annotation instanceof ${ENCODING_ANNOTATION}) {
				encoding = ((${ENCODING_ANNOTATION}) annotation).value();
			}
		}
		if (encoding == null) {
			return null;
		}
${indent(branches, '\t\t')}		return null;
	}

${encoders}
	/** The class that {@code type} names, or null when it names none. */
	private static java.lang.Class<?> rawType(java.lang.reflect.Type type) {
		if (type instanceof java.lang.Class) {
			return (java.lang.Class<?>) type;
		}
		if (type instanceof java.lang.reflect.ParameterizedType) {
			return rawType(((java.lang.reflect.ParameterizedType) type).getRawType());
		}
		return null;
	}

	/** The headers that {@code pairs} names, leaving out every pair whose value is null. */
	private static okhttp3.Headers headers(java.lang.String[][] pairs) {
		okhttp3.Headers.Builder builder = new okhttp3.Headers.Builder();
		for (java.lang.String[] pair : pairs) {
			if (pair[1] != null) {
				builder.set(pair[0], pair[1]);
			}
		}
		return builder.build();
	}

	/** The {@code Content-Disposition} of a part, with the name escaped as a multipart body requires. */
	private static java.lang.String contentDisposition(java.lang.String name) {
		java.lang.StringBuilder result = new java.lang.StringBuilder("form-data; name=\\"");
		for (int i = 0; i < name.length(); i++) {
			char c = name.charAt(i);
			switch (c) {
				case '\\n':
					result.append("%0A");
					break;
				case '\\r':
					result.append("%0D");
					break;
				case '"':
					result.append("%22");
					break;
				default:
					result.append(c);
					break;
			}
		}
		return result.append('"').toString();
	}

	/**
	 * Write one part into {@code body}.
	 * <p>
	 * A declared {@code Content-Type} names the media type of the part, which the part carries
	 * on its body rather than in its headers. A declared {@code Content-Length} is left out,
	 * because the multipart writer measures each part itself.
	 */
	private static void addPart(okhttp3.MultipartBody.Builder body, java.lang.String name, java.lang.String contentType, okhttp3.Headers declared, byte[] content) {
		okhttp3.Headers.Builder headers = new okhttp3.Headers.Builder();
		headers.add("Content-Disposition", contentDisposition(name));

		java.lang.String mediaType = contentType;
		if (declared != null) {
			for (int i = 0; i < declared.size(); i++) {
				java.lang.String header = declared.name(i);
				if ("Content-Type".equalsIgnoreCase(header)) {
					mediaType = declared.value(i);
				} else if (!"Content-Length".equalsIgnoreCase(header)) {
					headers.set(header, declared.value(i));
				}
			}
		}

		body.addPart(headers.build(), okhttp3.RequestBody.create(okhttp3.MediaType.parse(mediaType), content));
	}

}
`
}
