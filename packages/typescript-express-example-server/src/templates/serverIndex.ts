import { CodegenContent, CodegenExample, CodegenOperation, CodegenOperationGroup, CodegenResponse } from '@openapi-generator-plus/types'
import { ts, each, hasExamples, lowerCase } from '@openapi-generator-plus/template-utils'
import { TemplateRootContext } from '@openapi-generator-plus/typescript-generator-common'

/**
 * Convert an operation path (using OpenAPI's `{param}` placeholders) to an
 * Express route path (using `:param` placeholders).
 */
export function expressPath(path: string): string {
	if (!path) {
		return path
	}
	return path.replace(/\{([-a-zA-Z_]+)\}/g, ':$1')
}

/* A single example response, pushed onto the `defaultResponses` array that the
 * handler picks a random entry from. Rendered at column 0 — the caller aligns
 * it to the handler body's indentation. */
function pushExample(content: CodegenContent, example: CodegenExample): string {
	return `defaultResponses.push({
	contentType: "${content.mediaType.mediaType}",
	body: ${example.valueString},
})`
}

/* The handler body for an operation whose default response has examples: pick
 * one of the examples at random and send it. */
function exampleResponseBody(defaultResponse: CodegenResponse): string {
	const pushes = each(defaultResponse.contents, content => each(content.examples, example => pushExample(content, example), '\n'), '\n')
	return ts`
	const defaultResponses: { contentType: string, body: string }[] = []
	${pushes}
	const response = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
	res.set('Content-Type', response.contentType)
	res.send(response.body)`
}

/* The handler body for an operation with no example response to return. */
function unimplementedResponseBody(): string {
	return ts`
	//TODO
	res.status(503).send('Unimplemented')`
}

function operationHandler(op: CodegenOperation): string {
	const body = op.defaultResponse && hasExamples(op.defaultResponse) ? exampleResponseBody(op.defaultResponse) : unimplementedResponseBody()
	return ts`
app.${lowerCase(op.httpMethod)}('${expressPath(op.fullPath)}', function(req, res) {
${body}
})`
}

function operationGroup(group: CodegenOperationGroup): string {
	return ts`
/* ${group.name} */
${each(group.operations, operationHandler, '\n')}

`
}

/*
 * Each group's rendering ends with its own trailing blank line (matching how
 * the hbs `{{#each groups}}` body emitted one after every group, including
 * the last), so `const options` below is glued directly onto the `${each}`
 * interpolation rather than sitting on its own source line — putting it on
 * its own line would add a second, spurious blank line before it.
 */
export function index(ctx: TemplateRootContext): string {
	return ts`
import express from 'express'
import getopts from 'getopts'

const app = express()

${each(ctx.groups, operationGroup)}const options = getopts(process.argv.slice(2), {
	alias: {
		port: 'p',
	},
	unknown: (option) => {
		console.log(\`Unknown option: \${option}\`)
		return false
	},
})

const port = options.port || 3000
const server = app.listen(port, function() {
	const address = server.address()
	if (typeof address === 'string') {
		console.log(\`Listening on \${address}\`)
	} else if (address) {
		console.log(\`Listening on \${address.port}\`)
	}
})
`
}
