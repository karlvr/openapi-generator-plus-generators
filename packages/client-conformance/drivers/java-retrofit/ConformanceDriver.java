package com.example;

import java.io.File;
import java.io.OutputStream;
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

/**
 * The conformance driver for the java-retrofit-client generator.
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

	public static void main(String[] args) throws Exception {
		BASE_URL = args[0];
		RESULTS_PATH = args[1];
		new ConformanceDriver().run();
	}

	/** One call that the driver makes. It may fail, and the driver reports how. */
	private interface Operation {
		retrofit2.Response<?> run() throws Exception;
	}

	/** Turns a successful response into the value that the driver reports. */
	private interface Report {
		Object of(retrofit2.Response<?> response);
	}

	private final ObjectMapper mapper = ApiObjectMapper.create();
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

	private void run() throws Exception {
		/* Retrofit resolves each operation path against the base URL, which must end with "/" */
		retrofit2.Retrofit retrofit = new retrofit2.Retrofit.Builder()
			.baseUrl(BASE_URL + "/")
			.addConverterFactory(new ApiConverterFactory(mapper))
			.addConverterFactory(retrofit2.converter.jackson.JacksonConverterFactory.create(mapper))
			.build();

		QueryApi query = retrofit.create(QueryApi.class);
		FormApi form = retrofit.create(FormApi.class);
		MultipartApi multipart = retrofit.create(MultipartApi.class);
		JsonApi json = retrofit.create(JsonApi.class);
		ResponseApi response = retrofit.create(ResponseApi.class);
		BodyApi bodyApi = retrofit.create(BodyApi.class);
		SecurityApi security = retrofit.create(SecurityApi.class);

		startCase("query-scalars-values");
		call(() -> query.queryScalars("hello world", 42, 1.5, false, OffsetDateTime.parse(WHEN), LocalDate.parse(DAY)).execute());

		startCase("query-scalars-absent");
		call(() -> query.queryScalars(null, null, null, null, null, null).execute());

		startCase("query-scalars-empty-string");
		call(() -> query.queryScalars("", null, null, null, null, null).execute());

		startCase("query-arrays-form");
		call(() -> query.queryArrays(
			Arrays.asList("a", "b"),
			new com.example.support.NoExplodeList<>(Arrays.asList("c", "d")),
			null,
			null,
			Arrays.asList(OffsetDateTime.parse(WHEN), OffsetDateTime.parse(WHEN))).execute());

		startCase("query-arrays-delimited");
		call(() -> query.queryArrays(null, null, Arrays.asList("a", "b"), Arrays.asList("c", "d"), null).execute());

		startCase("query-arrays-empty");
		call(() -> query.queryArrays(
			new ArrayList<>(),
			new com.example.support.NoExplodeList<>(new ArrayList<>()),
			null,
			null,
			new ArrayList<>()).execute());

		startCase("query-objects-values");
		call(() -> query.queryObjects(anObject(), aPlainObject(), anotherObject()).execute());

		startCase("joined-values-encoded-once");
		call(() -> query.queryArrays(
			Arrays.asList("a b"),
			new com.example.support.NoExplodeList<>(Arrays.asList("a b")),
			null,
			null,
			null).execute());
		call(() -> query.queryObjects(
			null,
			new com.example.model.QueryObject().name("a b").when(OffsetDateTime.parse(WHEN)),
			null).execute());

		startCase("query-headers-values");
		call(() -> query.queryHeaders("hello", Arrays.asList(1, 2)).execute());

		startCase("query-cookies-values");
		/* Retrofit has no cookie parameter annotation, so the generated method takes none */
		call(() -> query.queryCookies().execute());

		startCase("query-required-values");
		call(() -> query.queryRequired("needed value", null, "needed header").execute());

		startCase("query-path-segment");
		call(() -> query.queryPathSegment(PATH_SEGMENT).execute());

		startCase("form-scalars-values");
		call(() -> form.formScalars(new com.example.model.FormScalarsRequest()
			.str("a")
			.num(1)
			.flag(false)
			.when(OffsetDateTime.parse(WHEN))).execute());

		startCase("form-scalars-null");
		call(() -> {
			com.example.model.FormScalarsRequest request = new com.example.model.FormScalarsRequest();
			request.setNullableStr(Optional.empty());
			request.setNullableNum(Optional.empty());
			request.setNullableFlag(Optional.empty());
			request.setNullableWhen(Optional.empty());
			return form.formScalars(request).execute();
		});

		startCase("form-scalars-absent");
		call(() -> form.formScalars(new com.example.model.FormScalarsRequest()).execute());

		startCase("form-arrays-values");
		call(() -> form.formArrays(new com.example.model.FormArraysRequest()
			.strs(Arrays.asList("a", "b"))
			.pipeStrs(Arrays.asList("c", "d"))).execute());

		startCase("form-arrays-null");
		call(() -> {
			com.example.model.FormArraysRequest request = new com.example.model.FormArraysRequest();
			request.setNullableStrs(Optional.empty());
			request.setNullablePipeStrs(Optional.empty());
			return form.formArrays(request).execute();
		});

		startCase("form-objects-values");
		call(() -> form.formObjects(new com.example.model.FormObjectsRequest()
			.obj(aPlainObject())
			.explodeObj(anObject())
			.deepObj(anotherObject())).execute());

		startCase("form-objects-null");
		call(() -> {
			com.example.model.FormObjectsRequest request = new com.example.model.FormObjectsRequest();
			request.setNullableObj(Optional.empty());
			request.setNullableExplodeObj(Optional.empty());
			request.setNullableDeepObj(Optional.empty());
			return form.formObjects(request).execute();
		});

		startCase("multipart-values");
		call(() -> multipart.multipartParts(new com.example.model.MultipartPartsRequest.MultipartFormData()
			.text("a")
			.json(anObject())
			.file(new com.example.model.MultipartPartsRequest.MultipartFormData.FilePart()
				.value("file content".getBytes(Charset.forName("UTF-8"))))).execute());

		startCase("multipart-json-content-type");
		call(() -> multipart.multipartParts(new com.example.model.MultipartPartsRequest.MultipartFormData()
			.json(anObject())).execute());

		startCase("multipart-null");
		call(() -> {
			com.example.model.MultipartPartsRequest.MultipartFormData request =
				new com.example.model.MultipartPartsRequest.MultipartFormData();
			request.setNullableText(Optional.empty());
			request.setNullableJson(Optional.empty());
			request.setNullableFile(Optional.empty());
			return multipart.multipartParts(request).execute();
		});

		startCase("json-null-properties");
		call(() -> {
			com.example.model.JsonBody body = new com.example.model.JsonBody().name("n");
			body.setNullableName(Optional.empty());
			body.setNullableCount(Optional.empty());
			body.setNullableWhen(Optional.empty());
			body.setNullableChild(Optional.empty());
			body.setNullableList(Optional.empty());
			return json.jsonBody(body).execute();
		});

		startCase("json-absent-properties");
		call(() -> json.jsonBody(new com.example.model.JsonBody().name("n")).execute());

		startCase("body-array");
		call(() -> bodyApi.bodyArray(Arrays.asList(anObject(), anotherObject())).execute());

		startCase("body-text");
		call(() -> bodyApi.bodyText(TEXT_BODY).execute());

		startCase("body-binary");
		call(() -> bodyApi.bodyBinary(BINARY_BODY.getBytes(Charset.forName("UTF-8"))).execute());

		startCase("response-json");
		call(() -> response.responseJson().execute());

		startCase("response-content-type-charset");
		call(() -> response.responseJson().execute());

		startCase("response-unknown-property");
		call(() -> response.responseJson().execute());

		startCase("response-array");
		call(() -> response.responseArray().execute());

		startCase("response-null-properties");
		call(() -> response.responseNullable().execute(), httpResponse -> statesOf((com.example.model.JsonBody) httpResponse.body()));

		startCase("response-headers");
		/* Retrofit gives the whole response, so a caller can read a header that the spec declares */
		call(() -> response.responseHeaders().execute(), httpResponse -> headerStates(
			((com.example.model.ResponseObject) httpResponse.body()).getName(),
			httpResponse.headers().get("X-Total-Count"),
			httpResponse.headers().get("X-Note")));

		startCase("response-empty-body");
		call(() -> response.responseJson().execute());

		startCase("response-no-content-type");
		call(() -> response.responseJson().execute());

		startCase("response-none");
		call(() -> response.responseNone().execute());

		startCase("response-error");
		call(() -> response.responseError().execute());

		startCase("response-error-body");
		call(() -> response.responseError().execute());

		startCase("response-undocumented-status");
		call(() -> response.responseJson().execute());

		/* Retrofit has no security annotation, so the generated client takes no credential */
		startCase("security-api-key-header");
		call(() -> security.securityApiKeyHeader().execute());

		startCase("security-api-key-query");
		call(() -> security.securityApiKeyQuery().execute());

		startCase("security-bearer");
		call(() -> security.securityBearer().execute());

		startCase("security-basic");
		call(() -> security.securityBasic().execute());

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

	/** Make one call, and record the response body that the client produced. */
	private void call(Operation operation) {
		call(operation, response -> response.body());
	}

	/**
	 * Make one call, and record the value that `report` makes of the response.
	 *
	 * Retrofit reports a failure response as a response, not as an exception, so the driver
	 * reads the status itself. Only a fault in the client itself throws.
	 */
	private void call(Operation operation, Report report) {
		Map<String, Object> call = new LinkedHashMap<>();
		try {
			retrofit2.Response<?> response = operation.run();
			if (response.isSuccessful()) {
				call.put("outcome", "success");
				call.put("value", report.of(response));
			} else {
				call.put("outcome", "error");
				call.put("httpStatus", response.code());
			}
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
		Map<String, Object> report = new HashMap<>();
		report.put("cases", results);
		mapper.writeValue(new File(RESULTS_PATH), report);
	}

}
