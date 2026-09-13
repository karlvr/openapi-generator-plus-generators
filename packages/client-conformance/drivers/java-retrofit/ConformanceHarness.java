package com.example;

import java.io.File;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * The scaffold that every driver of the java-retrofit-client family builds on:
 * announce a case, make a call, and write the report.
 *
 * The suite copies this class into the generated project next to the driver of
 * the suite that it runs. Nothing here depends on the generated API, so one copy
 * serves every suite.
 */
public abstract class ConformanceHarness {

	protected final String baseUrl;
	private final String resultsPath;

	private final ObjectMapper mapper = ApiObjectMapper.create();
	private final List<Map<String, Object>> results = new ArrayList<>();
	private List<Map<String, Object>> calls = new ArrayList<>();

	protected ConformanceHarness(String baseUrl, String resultsPath) {
		this.baseUrl = baseUrl;
		this.resultsPath = resultsPath;
	}

	/** One call that the driver makes. It may fail, and the driver reports how. */
	protected interface Operation {
		retrofit2.Response<?> run() throws Exception;
	}

	/** Turns a successful response into the value that the driver reports. */
	protected interface Report {
		Object of(retrofit2.Response<?> response);
	}

	/** The calls of the suite, in the order that the cases declare them. */
	protected abstract void run() throws Exception;

	/**
	 * A Retrofit instance for the generated API, against the recording server.
	 *
	 * Retrofit resolves each operation path against the base URL, which must end with "/".
	 */
	protected retrofit2.Retrofit retrofit() {
		return new retrofit2.Retrofit.Builder()
			.baseUrl(baseUrl + "/")
			.addConverterFactory(new ApiConverterFactory(mapper))
			.addConverterFactory(retrofit2.converter.jackson.JacksonConverterFactory.create(mapper))
			.build();
	}

	/** Run the calls of the suite, then write the report. */
	protected final void drive() throws Exception {
		run();
		writeResults();
	}

	/** Tell the server which case is starting, so it records and answers for that case. */
	protected void startCase(String id) throws Exception {
		calls = new ArrayList<>();
		Map<String, Object> result = new LinkedHashMap<>();
		result.put("id", id);
		result.put("calls", calls);
		results.add(result);

		HttpURLConnection connection = (HttpURLConnection) new URL(baseUrl + "/__conformance/case").openConnection();
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
	protected void call(Operation operation) {
		call(operation, response -> response.body());
	}

	/**
	 * Make one call, and record the value that `report` makes of the response.
	 *
	 * Retrofit reports a failure response as a response, not as an exception, so the driver
	 * reads the status itself. Only a fault in the client itself throws.
	 */
	protected void call(Operation operation, Report report) {
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
		mapper.writeValue(new File(resultsPath), report);
	}

}
