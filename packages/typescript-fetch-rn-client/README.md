# TypeScript Fetch React Native API generator for OpenAPI Generator Plus

An [OpenAPI Generator Plus](https://github.com/karlvr/openapi-generator-plus) template for a TypeScript API client using Fetch in React Native.

## Features

### Adds the `btoa` polyfill

The React Native JavaScript engine does not provide `btoa`. The generated client adds the `abab`
polyfill for it. The client is otherwise the same as the client of
[typescript-fetch-client](../typescript-fetch-client).

### Exports one API class per operation group

The generated client exports an API class for each group of operations, such as
`new PetApi(configuration)`. It also exports a factory function and a functional form of each group.
Use one of those if you prefer a function to a class.

### Parses the response body

Each operation resolves with the parsed body of the default response. The generated client reads a
JSON body, a text body and a binary body. It throws the `Response` for every other documented
response.

### Accepts your own `fetch`

Each API class takes a `fetch` function. Supply your own implementation for a request-scoped
`fetch`. Supply one also to add a retry, a timeout or a request log.

## Using

See the [OpenAPI Generator Plus](https://github.com/karlvr/openapi-generator-plus) documentation for how to use
generator templates.

See the [typescript-fetch-client](../typescript-fetch-client) README for the
[config file properties](../typescript-fetch-client#config-file), for
[supplying your own `fetch`](../typescript-fetch-client#supplying-your-own-fetch), and for
[customising the templates](../typescript-fetch-client#customising).
