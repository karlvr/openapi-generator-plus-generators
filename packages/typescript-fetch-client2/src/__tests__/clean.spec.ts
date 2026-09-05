import { prepare, DEFAULT_CONFIG } from './common'

test('clean path patterns cover the api directory', async() => {
	const result = await prepare('accept.yml', DEFAULT_CONFIG)

	/* The generator emits one file per operation group, so the clean step must cover those files */
	expect(result.state.generator.cleanPathPatterns()).toEqual(['src/api/*.ts', 'src/api'])
})

test('clean path patterns respect relativeSourceOutputPath', async() => {
	const result = await prepare('accept.yml', {})

	/* Without npm options the source output path is the output path itself */
	expect(result.state.generator.cleanPathPatterns()).toEqual(['api/*.ts', 'api'])
})
