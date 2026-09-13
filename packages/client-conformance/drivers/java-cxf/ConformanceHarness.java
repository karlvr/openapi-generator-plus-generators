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
import com.fasterxml.jackson.datatype.jdk8.Jdk8Module;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

/**
 * The scaffold that every driver of the java-cxf-client family builds on:
 * announce a case, make a call, and write the report.
 *
 * The suite copies this class into the generated project next to the driver of
 * the suite that it runs. Nothing here depends on the generated API, so one copy
 * serves every suite. A driver that must recognise an exception that its own spec
 * generates overrides {@link #classify(Throwable)}.
 */
public abstract class ConformanceHarness {

	protected final String baseUrl;
	private final String resultsPath;

	private final List<Map<String, Object>> results = new ArrayList<>();
	private List<Map<String, Object>> calls = new ArrayList<>();

	protected ConformanceHarness(String baseUrl, String resultsPath) {
		this.baseUrl = baseUrl;
		this.resultsPath = resultsPath;
	}

	/** One call that the driver makes. It may fail, and the driver reports how. */
	protected interface Operation {
		Object run() throws Exception;
	}

	/** The calls of the suite, in the order that the cases declare them. */
	protected abstract void run() throws Exception;

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

	/**
	 * The report of a failure that the driver's own spec declares, or null when
	 * `error` is not such a failure.
	 *
	 * A documented failure response has an exception of its own, generated from the
	 * spec, so only the driver of that spec can name it. The default recognises none.
	 */
	protected Map<String, Object> classify(Throwable error) {
		return null;
	}

	/** Make one call, and record what the client produced. */
	protected void call(Operation operation) {
		Map<String, Object> call = new LinkedHashMap<>();
		try {
			Object value = operation.run();
			call.put("outcome", "success");
			call.put("value", value);
		} catch (Throwable e) {
			Map<String, Object> documented = classify(e);
			if (documented != null) {
				call.putAll(documented);
			} else if (e instanceof UnexpectedResponseException) {
				call.put("outcome", "error");
				call.put("httpStatus", ((UnexpectedResponseException) e).getStatus());
			} else {
				/*
				 * An Error, such as a missing class or method, says that the generated client
				 * cannot run at all. Catching it keeps that in the report of one case, rather
				 * than losing every case that follows.
				 */
				call.put("outcome", "exception");
				call.put("error", e.getClass().getName() + ": " + e.getMessage());
			}
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
		mapper.writeValue(new File(resultsPath), report);
	}

}
