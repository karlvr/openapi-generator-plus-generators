# Strongly-typed TypeScript Fetch Node API generator for OpenAPI Generator Plus

An [OpenAPI Generator Plus](https://github.com/karlvr/openapi-generator-plus) template for a TypeScript API client using Fetch in Node,
with support for multiple strongly-typed responses.

This template supersedes [typescript-fetch-node-client](../typescript-fetch-node-client). The
generated code is not backwards compatible with the code of the earlier template.

## Features

### Uses `node-fetch`

The generated client uses [`node-fetch`](https://www.npmjs.com/package/node-fetch), `form-data` and
`abab`. It types a request and a response with the `RequestInit` and the `Response` of `node-fetch`.
A binary value is a `string | Buffer`. Use
[typescript-fetch-client2](../typescript-fetch-client2) instead for a client that uses the standard
`fetch` types. That client also runs in a browser.

### Exports one function per operation

The generated client exports a standalone function for each operation, such as `getPetById(id)`.
Import only the function that you call. A bundler can then remove the rest.

### Returns strongly-typed responses

Each operation resolves with a discriminated union on the `status` field. The compiler makes you
handle every response that the API specification documents. It also makes you handle an
undocumented response, and an error. The operation does not throw.

### Accepts configuration at three levels

A `Configuration` holds the base URI, the `fetch` function and the authentication. Set a
configuration at one of three levels:

1. A default configuration for the whole client.
2. A configuration for one group of operations.
3. A configuration for a single call.

### Accepts your own `fetch`

The generated client calls the `fetch` function from its `Configuration`. Supply your own
implementation for a request-scoped `fetch`. Supply one also to add a retry, a timeout or a request
log. See [Supplying your own `fetch`](#supplying-your-own-fetch).

## Using

See the [OpenAPI Generator Plus](https://github.com/karlvr/openapi-generator-plus) documentation for how to use
generator templates.

The generated client has the same shape as the client of
[typescript-fetch-client2](../typescript-fetch-client2). See that template's README for
[configuring the generated API client](../typescript-fetch-client2#configuring-the-generated-api-client),
[error handling](../typescript-fetch-client2#error-handling) and
[tree shaking](../typescript-fetch-client2#tree-shaking).

### Supplying your own `fetch`

The generated client calls the `fetch` function from its `Configuration`. Set the `fetch` property
to supply your own implementation. The function must match the generated `FetchAPI` type:

```ts
export type FetchAPI = (url: string, init?: RequestInit) => Promise<Response>;
```

Set your `fetch` as the default for every call:

```ts
import { Configuration, setDefaultConfiguration } from './generated-client'

setDefaultConfiguration(new Configuration({ fetch: myFetch }))
```

Pass a `Configuration` as the last argument to set the `fetch` function for a single call. This
suits a request-scoped `fetch`, such as one that a server framework gives to a request handler:

```ts
import { Configuration, getDefaultConfiguration } from './generated-client'
import { getPetById } from './generated-client/api/pet'

const configuration = new Configuration({ ...getDefaultConfiguration(), fetch: myFetch })
const response = await getPetById(petId, undefined, configuration)
```

The `undefined` argument is the optional `RequestInit`.

> [!NOTE]
> A new `Configuration` does not inherit the default configuration. The example above spreads
> `getDefaultConfiguration()` to keep the base URI and the authentication of the default
> configuration.

Use `withConfiguration(...)` to set the `fetch` function for a group of operations. See
[configuring the generated API client](../typescript-fetch-client2#configuring-the-generated-api-client).

A custom `fetch` can also add behaviour that the generated client does not provide. Add a retry, a
timeout or a request log:

```ts
import type { FetchAPI } from './generated-client'

const loggingFetch: FetchAPI = async (url, init) => {
	console.log(`${init?.method ?? 'GET'} ${url}`)
	return fetch(url, init)
}
```

> [!IMPORTANT]
> This template types `fetch` with the `RequestInit` and the `Response` of `node-fetch`. A `fetch`
> implementation that uses the standard DOM types does not match that signature. Use
> [typescript-fetch-client2](../typescript-fetch-client2) if you must supply a standard `fetch`.

## Config file

The available config file properties are:

### Project layout

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`relativeSourceOutputPath`|`string`|The path to output generated source code, relative to the output path.|`./` or `./src` if `npm` is specified.|

### Code style

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`constantStyle`|`"allCapsSnake"` \| `"allCaps"` \| `"camelCase"` \| `"pascalCase"`|The style to use for constant names, i.e. `MY_CONSTANT`, `MYCONSTANT`, `myConstant` or `MyConstant`. Constant names are used for enum member names, if `enumMemberStyle` is `constant`.|`"pascalCase"`|
|`enumMemberStyle`|`"preserve"` \| `"constant"`|The style to use for enum member names: `preserve` _attempts_ to match the enum member name to the literal enum value from the spec; `constant` uses the `constantStyle` rules.|`"constant"`|
|`dateApproach`|`"native"\|"string"\|"blind-date"`|Whether to use `string` for date and time and `Date` for date-time, or just `string`, or whether to use [`blind-date`](https://npmjs.com/blind-date) for dates and times.|`native`|
|`esm`|`boolean`|Whether to output ESM-style code.|`false`|
|`apiNamespace`|`string`|The name of the TypeScript namespace used to export all models.|`"Api"`|

### `blind-date`

The [blind-date](https://npmjs.com/blind-date) library provides some typesafety for dates and times as strings
in TypeScript. You can configure the generated code using `blind-date`:

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`blindDate`|`BlindDateConfig`|Configuration for `blind-date`.|`undefined`|

#### `BlindDateConfig`

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`dateTimeImplementation`|`string`|The date-time implementation to use; either `OffsetDateTimeString` or `LocalDateTimeString`.|`OffsetDateTimeString`|

### TypeScript

A `tsconfig.json` file will be output if you specify any of the TypeScript config options.

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`typescript`|`TypeScriptConfig`|Configuration for the `tsconfig.json` file.|`undefined`|

#### `TypeScriptConfig`

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`target`|`string`|The ECMAScript target version.|`ES5`|
|`libs`|`string[]`|The `lib` entries to use in `tsconfig.json`. The value `$target` expands to the `target`.|The `target`, plus `DOM` and `ES2021.String`.|

### Packaging

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`npm`|`NpmConfig`|Configuration for generating an npm `package.json`|`undefined`|

#### `NpmConfig`

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`name`|`string`|The package name|`typescript-fetch-api`|
|`version`|`string`|The package version|`0.0.1`|
|`repository`|`string`|The URL to the package repository|`undefined`|
|`private`|`boolean`|Whether the package is private|`true`|

### Overrides

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`customTemplates`|`string`|The path to a directory containing custom Handlebars templates, relative to the config file. See Customising below.|`undefined`|

## Customising

This generator supports a `customTemplates` config file property to specify a directory containing Handlebars templates that will be used to override built-in templates.

Any custom template will have the original template available as a partial named by prefixing the template name with `original`, and then upper-casing the first letter, e.g. `originalModelEnum`.

Some of the templates in the generator are designed to support overriding for custom requirements. Please inspect the templates in the `templates` directory.
