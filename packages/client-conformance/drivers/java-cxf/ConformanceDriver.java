package com.example;

import java.io.OutputStream;
import java.io.File;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.Charset;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jdk8.Jdk8Module;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

/**
 * The conformance driver for the java-cxf-client generator.
 *
 * The suite copies this file into the generated project, so the project's own
 * compiler checks it against the generated types. A signature change that a
 * caller cannot write then fails the build.
 *
 * The driver only makes calls. It reports what each call produced, and the suite
 * asserts on that, and on what a recording server received.
 *
 * Run it as: java -cp ... com.example.ConformanceDriver <baseUrl> <resultsPath>
 */
public class ConformanceDriver {

	private static String BASE_URL;
	private static String RESULTS_PATH;

	private static final String WHEN = "2020-01-02T03:04:05.678Z";
	private static final String DAY = "2020-01-02";
	private static final String PATH_SEGMENT = "a b/c?d#e&f+g%h:i@j";
	private static final String TEXT_BODY = "plain \"text\" body";
	private static final String BINARY_BODY = "binary content";
	private static final String API_KEY_HEADER = "header-key";
	private static final String API_KEY_QUERY = "query-key";
	private static final String BEARER_TOKEN = "bearer-token";
	private static final String BASIC_USERNAME = "basic-user";
	private static final String BASIC_PASSWORD = "basic-secret";

	public static void main(String[] args) throws Exception {
		BASE_URL = args[0];
		RESULTS_PATH = args[1];
		new ConformanceDriver().run();
	}

	/** One call that the driver makes. It may fail, and the driver reports how. */
	private interface Operation {
		Object run() throws Exception;
	}

	private final List<Map<String, Object>> results = new ArrayList<>();
	private List<Map<String, Object>> calls = new ArrayList<>();

	private com.example.model.QueryObject anObject() {
		return new com.example.model.QueryObject()
			.name("x")
			.count(1)
			.when(OffsetDateTime.parse(WHEN));
	}

	/**
	 * A second object, so a case that sends more than one object can tell them apart.
	 * The driver passes its arguments by position, so two equal objects would hide a
	 * call that passes them in the wrong order.
	 */
	private com.example.model.QueryObject anotherObject() {
		return new com.example.model.QueryObject()
			.name("y")
			.count(2)
			.when(OffsetDateTime.parse(WHEN));
	}

	/** A joined style writes every property into one value, so it needs values that no style has to encode. */
	private com.example.model.QueryObject aPlainObject() {
		return new com.example.model.QueryObject().name("x").count(1);
	}

	/**
	 * How the driver reports one nullable property: "absent" when the model carries
	 * no value, "null" when it carries a null, and the value as text otherwise.
	 *
	 * A model holds a null and an absent property differently in each language, and
	 * neither survives a plain serialisation. So the driver names the state itself.
	 */
	private static String state(Optional<?> value) {
		if (value == null) {
			return "absent";
		}
		return value.isPresent() ? String.valueOf(value.get()) : "null";
	}

	/** The state of every property of a nullable response model. */
	private Map<String, Object> statesOf(com.example.model.JsonBody body) {
		Map<String, Object> states = new LinkedHashMap<>();
		states.put("name", body.getName());
		states.put("nullableName", state(body.getNullableName()));
		states.put("nullableCount", state(body.getNullableCount()));
		states.put("nullableWhen", state(body.getNullableWhen()));
		states.put("nullableChild", state(body.getNullableChild()));
		states.put("nullableList", state(body.getNullableList()));
		return states;
	}

	/**
	 * How the driver reports the documented headers of a response: each value as text,
	 * or "absent" where the client exposes none.
	 *
	 * The report carries the name of the model too, so a case can also see that the body
	 * still arrived.
	 */
	private Map<String, Object> headerStates(String name, String totalCount, String note) {
		Map<String, Object> states = new LinkedHashMap<>();
		states.put("name", name);
		states.put("totalCount", totalCount != null ? totalCount : "absent");
		states.put("note", note != null ? note : "absent");
		return states;
	}

	private void run() throws Exception {
		QueryApi query = new com.example.impl.QueryApiImpl(BASE_URL);
		MultipartApi multipart = new com.example.impl.MultipartApiImpl(BASE_URL);
		JsonApi json = new com.example.impl.JsonApiImpl(BASE_URL);
		ResponseApi response = new com.example.impl.ResponseApiImpl(BASE_URL);
		BodyApi bodyApi = new com.example.impl.BodyApiImpl(BASE_URL);
		com.example.impl.SecurityApiImpl security = new com.example.impl.SecurityApiImpl(BASE_URL);

		startCase("query-scalars-values");
		call(() -> {
			query.queryScalars(new com.example.params.QueryScalarsParams()
				.str("hello world")
				.num(42)
				.dbl(1.5)
				.flag(false)
				.when(OffsetDateTime.parse(WHEN))
				.day(LocalDate.parse(DAY)));
			return null;
		});

		startCase("query-scalars-absent");
		call(() -> {
			query.queryScalars(new com.example.params.QueryScalarsParams());
			return null;
		});

		startCase("query-scalars-empty-string");
		call(() -> {
			query.queryScalars(new com.example.params.QueryScalarsParams().str(""));
			return null;
		});

		startCase("query-arrays-form");
		call(() -> {
			query.queryArrays(new com.example.params.QueryArraysParams()
				.formExplode(Arrays.asList("a", "b"))
				.formNoExplode(new com.example.support.NoExplodeList<>(Arrays.asList("c", "d")))
				.dateTimes(Arrays.asList(OffsetDateTime.parse(WHEN), OffsetDateTime.parse(WHEN))));
			return null;
		});

		startCase("query-arrays-delimited");
		call(() -> {
			query.queryArrays(new com.example.params.QueryArraysParams()
				.pipe(Arrays.asList("a", "b"))
				.space(Arrays.asList("c", "d")));
			return null;
		});

		startCase("query-arrays-empty");
		call(() -> {
			query.queryArrays(new com.example.params.QueryArraysParams()
				.formExplode(new ArrayList<>())
				.formNoExplode(new com.example.support.NoExplodeList<>(new ArrayList<>()))
				.dateTimes(new ArrayList<>()));
			return null;
		});

		startCase("query-objects-values");
		call(() -> {
			query.queryObjects(new com.example.params.QueryObjectsParams()
				.explode(anObject())
				.noExplode(aPlainObject())
				.deep(anotherObject()));
			return null;
		});

		startCase("joined-values-encoded-once");
		call(() -> {
			query.queryArrays(new com.example.params.QueryArraysParams()
				.formExplode(Arrays.asList("a b"))
				.formNoExplode(new com.example.support.NoExplodeList<>(Arrays.asList("a b"))));
			return null;
		});
		call(() -> {
			query.queryObjects(new com.example.params.QueryObjectsParams()
				.noExplode(new com.example.model.QueryObject().name("a b").when(OffsetDateTime.parse(WHEN))));
			return null;
		});

		startCase("query-headers-values");
		call(() -> {
			query.queryHeaders(new com.example.params.QueryHeadersParams()
				.xText("hello")
				.xNumbers(Arrays.asList(1, 2)));
			return null;
		});

		startCase("query-cookies-values");
		call(() -> {
			query.queryCookies(new com.example.params.QueryCookiesParams()
				.sessionId("abc")
				.theme("dark"));
			return null;
		});

		startCase("query-required-values");
		call(() -> {
			query.queryRequired(new com.example.params.QueryRequiredParams()
				.needed("needed value")
				.xNeeded("needed header"));
			return null;
		});

		startCase("query-path-segment");
		call(() -> {
			query.queryPathSegment(PATH_SEGMENT);
			return null;
		});

		startCase("multipart-values");
		call(() -> {
			multipart.multipartParts(new com.example.model.MultipartPartsRequest.MultipartFormData()
				.text("a")
				.json(anObject())
				.file(new com.example.model.MultipartPartsRequest.MultipartFormData.FilePart()
					.value("file content".getBytes(Charset.forName("UTF-8")))));
			return null;
		});

		startCase("multipart-json-content-type");
		call(() -> {
			multipart.multipartParts(new com.example.model.MultipartPartsRequest.MultipartFormData()
				.json(anObject()));
			return null;
		});

		startCase("multipart-null");
		call(() -> {
			com.example.model.MultipartPartsRequest.MultipartFormData request =
				new com.example.model.MultipartPartsRequest.MultipartFormData();
			request.setNullableText(Optional.empty());
			request.setNullableJson(Optional.empty());
			request.setNullableFile(Optional.empty());
			multipart.multipartParts(request);
			return null;
		});

		startCase("json-null-properties");
		call(() -> {
			com.example.model.JsonBody body = new com.example.model.JsonBody().name("n");
			body.setNullableName(Optional.empty());
			body.setNullableCount(Optional.empty());
			body.setNullableWhen(Optional.empty());
			body.setNullableChild(Optional.empty());
			body.setNullableList(Optional.empty());
			json.jsonBody(body);
			return null;
		});

		startCase("json-absent-properties");
		call(() -> {
			json.jsonBody(new com.example.model.JsonBody().name("n"));
			return null;
		});

		startCase("body-array");
		call(() -> {
			bodyApi.bodyArray(Arrays.asList(anObject(), anotherObject()));
			return null;
		});

		startCase("body-text");
		call(() -> {
			bodyApi.bodyText(TEXT_BODY);
			return null;
		});

		startCase("body-binary");
		call(() -> {
			bodyApi.bodyBinary(BINARY_BODY.getBytes(Charset.forName("UTF-8")));
			return null;
		});

		startCase("response-json");
		call(() -> response.responseJson());

		startCase("response-content-type-charset");
		call(() -> response.responseJson());

		startCase("response-unknown-property");
		call(() -> response.responseJson());

		startCase("response-array");
		call(() -> response.responseArray());

		startCase("response-null-properties");
		call(() -> statesOf(response.responseNullable()));

		startCase("response-headers");
		call(() -> {
			/*
			 * The operation returns the model alone, so the client exposes no header. The
			 * declared type stops compiling if that ever changes.
			 */
			com.example.model.ResponseObject model = response.responseHeaders();
			return headerStates(model.getName(), null, null);
		});

		startCase("response-empty-body");
		call(() -> response.responseJson());

		startCase("response-no-content-type");
		call(() -> response.responseJson());

		startCase("response-none");
		call(() -> {
			response.responseNone();
			return null;
		});

		startCase("response-error");
		call(() -> response.responseError());

		startCase("response-error-body");
		call(() -> response.responseError());

		startCase("response-undocumented-status");
		call(() -> response.responseJson());

		/*
		 * The client takes the credential of one scheme at a time, through the method that
		 * the scheme names. Each scheme has its own value, so a client that reads the
		 * credential of another scheme shows it.
		 */
		startCase("security-api-key-header");
		security.authorizeApiKeyHeader(API_KEY_HEADER);
		call(() -> {
			security.securityApiKeyHeader();
			return null;
		});

		startCase("security-api-key-query");
		security.authorizeApiKeyQuery(API_KEY_QUERY);
		call(() -> {
			security.securityApiKeyQuery();
			return null;
		});

		startCase("security-bearer");
		security.authorizeBearerAuth(BEARER_TOKEN);
		call(() -> {
			security.securityBearer();
			return null;
		});

		startCase("security-basic");
		security.authorizeBasicAuth(BASIC_USERNAME, BASIC_PASSWORD);
		call(() -> {
			security.securityBasic();
			return null;
		});

		writeResults();
	}

	/** Tell the server which case is starting, so it records and answers for that case. */
	private void startCase(String id) throws Exception {
		calls = new ArrayList<>();
		Map<String, Object> result = new LinkedHashMap<>();
		result.put("id", id);
		result.put("calls", calls);
		results.add(result);

		HttpURLConnection connection = (HttpURLConnection) new URL(BASE_URL + "/__conformance/case").openConnection();
		connection.setRequestMethod("POST");
		connection.setDoOutput(true);
		OutputStream out = connection.getOutputStream();
		try {
			out.write(id.getBytes(Charset.forName("UTF-8")));
		} finally {
			out.close();
		}
		connection.getResponseCode();
		connection.disconnect();
	}

	/** Make one call, and record what the client produced. */
	private void call(Operation operation) {
		Map<String, Object> call = new LinkedHashMap<>();
		try {
			Object value = operation.run();
			call.put("outcome", "success");
			call.put("value", value);
		} catch (ResponseApi.ResponseError400Exception e) {
			/* A documented failure response has its own exception, which carries the status of its declaration */
			call.put("outcome", "error");
			call.put("httpStatus", 400);
			call.put("value", e.getEntity());
		} catch (UnexpectedResponseException e) {
			call.put("outcome", "error");
			call.put("httpStatus", e.getStatus());
		} catch (Throwable e) {
			/*
			 * An Error, such as a missing class or method, says that the generated client
			 * cannot run at all. Catching it keeps that in the report of one case, rather
			 * than losing every case that follows.
			 */
			call.put("outcome", "exception");
			call.put("error", e.getClass().getName() + ": " + e.getMessage());
		}
		calls.add(call);
	}

	private void writeResults() throws Exception {
		ObjectMapper mapper = new ObjectMapper();
		mapper.registerModule(new Jdk8Module());
		mapper.registerModule(new JavaTimeModule());
		mapper.configure(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);

		Map<String, Object> report = new HashMap<>();
		report.put("cases", results);
		mapper.writeValue(new File(RESULTS_PATH), report);
	}

}
