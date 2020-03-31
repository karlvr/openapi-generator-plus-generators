import SwaggerParser from 'swagger-parser'
import { OpenAPI } from 'openapi-types'
import path from 'path'
import { CodegenState, CodegenConfig, toSpecVersion } from '@openapi-generator-plus/core'
import Generator from '../index'
import { CodegenOptionsJava } from '../types'

export async function createTestState(specName: string): Promise<CodegenState<CodegenOptionsJava>> {
	const parser = new SwaggerParser()

	const root: OpenAPI.Document = await parser.parse(path.resolve(__dirname, specName))

	const config: CodegenConfig = {
		inputPath: '',
		outputPath: '',
		generator: '',
	}

	const generator = Generator
	const options = generator.options(config)

	const state: CodegenState<CodegenOptionsJava> = {
		root,
		parser,
		generator,
		config,
		options,
		anonymousModels: {},
		specVersion: toSpecVersion(root),
	}
	return state
}
