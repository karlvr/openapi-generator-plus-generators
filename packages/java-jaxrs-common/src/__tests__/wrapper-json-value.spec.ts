import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'
import { createCodegenResult } from '@openapi-generator-plus/testing'
import createGenerator from '..'
import path from 'path'
import fs from 'fs'
import { CodegenConfig, CodegenGeneratorConstructor, CodegenGeneratorType } from '@openapi-generator-plus/types'

const myCreateGenerator: CodegenGeneratorConstructor = (config, context) => ({
	...createGenerator(config, context),
	generatorType: () => CodegenGeneratorType.SERVER,
})

const DEFAULT_CONFIG: CodegenConfig = {}

const MODEL_PATH = path.join('com', 'example', 'model')

/**
 * A wrapper class wraps a single value (e.g. for a member of a oneOf of primitives). The wrapped value
 * must be annotated with `@JsonValue` so the wrapper serializes as its raw value rather than as an
 * object with a `value` property, paired with the `@JsonCreator` factory for deserialization. The
 * `@JsonValue` annotation replaces the `@JsonProperty` that a normal property would have.
 */
async function expectWrapperJsonValue(useLombok: boolean): Promise<void> {
	const result = await createCodegenResult(path.resolve(__dirname, 'wrapper-json-value.yml'), {
		...DEFAULT_CONFIG,
		useLombok,
	}, myCreateGenerator)
	await testGenerate(result, {
		testName: `wrapper-json-value/${useLombok ? 'lombok' : 'plain'}`,
		postProcess: async(basePath) => {
			const content = await fs.promises.readFile(path.join(basePath, MODEL_PATH, 'Thing.java'), 'utf-8')

			/* Both wrappers (string and integer) carry @JsonValue on their value, and its @JsonCreator partner */
			expect(content.match(/@com\.fasterxml\.jackson\.annotation\.JsonValue/g)).toHaveLength(2)
			expect(content.match(/@com\.fasterxml\.jackson\.annotation\.JsonCreator/g)).toHaveLength(2)

			/* @JsonValue replaces @JsonProperty on the wrapped value, so there is no @JsonProperty */
			expect(content).not.toContain('@com.fasterxml.jackson.annotation.JsonProperty')
		},
	})
}

test('wrapper class value has @JsonValue (Lombok)', async() => {
	await expectWrapperJsonValue(true)
})

test('wrapper class value has @JsonValue (plain)', async() => {
	await expectWrapperJsonValue(false)
})
