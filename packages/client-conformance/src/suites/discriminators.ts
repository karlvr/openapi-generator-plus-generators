import * as path from 'path'
import { RecordedRequest } from '../server'
import { ConformanceCase, ConformanceSuite, DriverCall } from '../types'

/**
 * The member that the boolean request case sends. It takes `thisProperty` from
 * `IndependentObject`, so it shows what a client makes of an inherited
 * discriminator property.
 */
const SUB_OBJECT_2 = { thisProperty: false, otherProperty2: 'y' }

/** The member that the boolean response case receives. It declares `thisProperty` itself. */
const SUB_OBJECT_1 = { thisProperty: true, otherProperty1: 'x' }

/** The base schema, sent and received on its own. */
const INDEPENDENT_OBJECT = { thisProperty: true, otherProperty2: 'z' }

/** A member of a string discriminator with no mapping, so the value is the schema name. */
const CAT = { petType: 'Cat', name: 'mog' }

/** A member of an enum discriminator. A client must write the enum value, not the enum name. */
const CIRCLE = { kind: 'circle', label: 'round', radius: 1.5 }

/**
 * A member of two discriminators that disagree on its value. `Feline` names it "lion", and
 * `LegacyFeline` names it "LION", so each case sends the value of its own discriminator.
 */
const LION = { species: 'lion', name: 'leo' }
const LEGACY_LION = { species: 'LION', name: 'leo' }

/** The JSON that the server answers with for a case, as a canned response. */
function jsonResponse(body: object) {
	return {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	}
}

/**
 * Assert that the client sent `expected` as its JSON body, with the discriminator
 * property once.
 *
 * A parsed comparison alone cannot see a repeated key, because a parser keeps
 * the last value. A client that writes the type id and the field both produces
 * such a body, so the raw text is checked for the key as well.
 */
function expectJsonBody(request: RecordedRequest, expected: object, discriminatorProperty: string): void {
	expect(request.headers['content-type'][0]).toMatch(/^application\/json(;|$)/)
	expect(JSON.parse(request.body)).toEqual(expected)

	const occurrences = request.body.match(new RegExp(`"${discriminatorProperty}"\\s*:`, 'g')) ?? []
	expect(occurrences).toHaveLength(1)
}

/** Assert that the client made `expected` of the one response in the case. */
function expectValue(calls: DriverCall[], expected: object): void {
	expect(calls).toHaveLength(1)
	expect(calls[0].outcome).toBe('success')
	expect(calls[0].value).toEqual(expected)
}

/**
 * Every discriminator case, in the order that a driver runs them.
 *
 * Each case sends or receives a model that takes part in a discriminator. The
 * discriminator property must go on the wire once, with the type that the spec
 * gives it, and a client must read it back into the model. A client that lets a
 * caller build a member without the value must fill it in.
 */
export const DISCRIMINATOR_CASES: ConformanceCase[] = [
	{
		id: 'discriminator-boolean-request',
		description: 'writes a boolean discriminator that a member inherits, once and as a boolean',
		requests: [{ method: 'POST', path: '/discriminator/boolean' }],
		response: jsonResponse(SUB_OBJECT_2),
		expectRequests(requests) {
			/*
			 * A client that lets its serializer write the type id sends the value as a
			 * string, and a client that also keeps the field sends the key twice. Both
			 * fail here.
			 */
			expectJsonBody(requests[0], SUB_OBJECT_2, 'thisProperty')
		},
		expectCalls(calls) {
			expectValue(calls, SUB_OBJECT_2)
		},
	},
	{
		id: 'discriminator-boolean-response',
		description: 'reads a boolean discriminator into the member that declares it',
		requests: [{ method: 'GET', path: '/discriminator/boolean' }],
		response: jsonResponse(SUB_OBJECT_1),
		expectCalls(calls) {
			/*
			 * A client that picks the wrong member fails on the property that only the
			 * right one declares. A client that drops the discriminator property from the
			 * model reports it absent.
			 */
			expectValue(calls, SUB_OBJECT_1)
		},
	},
	{
		id: 'discriminator-base-standalone',
		description: 'keeps a discriminator property in the base schema that declares it',
		requests: [{ method: 'POST', path: '/discriminator/base' }],
		response: jsonResponse(INDEPENDENT_OBJECT),
		expectRequests(requests) {
			/*
			 * IndependentObject is reached on its own here, outside the discriminator. The
			 * spec requires thisProperty, so the model must let a caller send it.
			 */
			expectJsonBody(requests[0], INDEPENDENT_OBJECT, 'thisProperty')
		},
		expectCalls(calls) {
			expectValue(calls, INDEPENDENT_OBJECT)
		},
	},
	{
		id: 'discriminator-string-request',
		description: 'writes a string discriminator that a member inherits, once',
		requests: [{ method: 'POST', path: '/discriminator/pet' }],
		response: jsonResponse(CAT),
		expectRequests(requests) {
			expectJsonBody(requests[0], CAT, 'petType')
		},
		expectCalls(calls) {
			expectValue(calls, CAT)
		},
	},
	{
		id: 'discriminator-enum-request',
		description: 'writes an enum discriminator that a member inherits, once and as the enum value',
		requests: [{ method: 'POST', path: '/discriminator/shape' }],
		response: jsonResponse(CIRCLE),
		expectRequests(requests) {
			expectJsonBody(requests[0], CIRCLE, 'kind')
		},
		expectCalls(calls) {
			expectValue(calls, CIRCLE)
		},
	},
	{
		id: 'discriminator-default-value',
		description: 'sends the discriminator value of a member that the caller never set',
		requests: [{ method: 'POST', path: '/discriminator/pet' }],
		response: jsonResponse(CAT),
		/*
		 * A client in a language with literal types makes the compiler require the
		 * value, so a caller cannot leave it unset, and there is no default to check.
		 */
		skipDrivers: {
			'fetch-client': 'a literal type makes the compiler require the value',
			'fetch-client2': 'a literal type makes the compiler require the value',
		},
		expectRequests(requests) {
			/*
			 * A client that lets a caller build a member without its discriminator value
			 * must fill the value in itself. A caller wrote code against a client that had
			 * no setter for it, and that code must keep sending the right value.
			 */
			expectJsonBody(requests[0], CAT, 'petType')
		},
		expectCalls(calls) {
			expectValue(calls, CAT)
		},
	},
	{
		id: 'discriminator-conflicting-values',
		description: 'sends the value that a caller sets on a member of discriminators that disagree on it',
		requests: [{ method: 'POST', path: '/discriminator/feline' }],
		response: jsonResponse(LION),
		expectRequests(requests) {
			/*
			 * No one value names Lion, so a client must not fix the value to either. A client
			 * that fixes it to the value of the other discriminator sends "LION" here.
			 */
			expectJsonBody(requests[0], LION, 'species')
		},
		expectCalls(calls) {
			expectValue(calls, LION)
		},
	},
	{
		id: 'discriminator-conflicting-values-other',
		description: 'sends the other value of a member of discriminators that disagree on it',
		requests: [{ method: 'POST', path: '/discriminator/legacy-feline' }],
		response: jsonResponse(LEGACY_LION),
		expectRequests(requests) {
			expectJsonBody(requests[0], LEGACY_LION, 'species')
		},
		expectCalls(calls) {
			expectValue(calls, LEGACY_LION)
		},
	},

]

/**
 * The discriminator conformance suite.
 *
 * A schema that declares a discriminator property must keep it, because a caller
 * may reach that schema on its own. These cases show that on the wire, in both
 * directions, for a boolean, a string and an enum discriminator.
 */
export const DISCRIMINATORS: ConformanceSuite = {
	id: 'discriminators',
	spec: path.join(__dirname, '..', '..', 'specs', 'discriminators.yml'),
	cases: DISCRIMINATOR_CASES,
}
