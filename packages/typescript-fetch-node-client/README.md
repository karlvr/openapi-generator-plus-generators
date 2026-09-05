# TypeScript Fetch Node API generator for OpenAPI Generator Plus

An [OpenAPI Generator Plus](https://github.com/karlvr/openapi-generator-plus) template for a TypeScript API client using Fetch in Node.

> [!NOTE]
> [typescript-fetch-node-client2](../typescript-fetch-node-client2) supersedes this template. Use
> that template for a new project. This template stays available. An existing project does not have
> to migrate.

## Features

### Uses `node-fetch`

The generated client uses [`node-fetch`](https://www.npmjs.com/package/node-fetch), `form-data` and
`abab`. It types a request and a response with the `RequestInit` and the `Response` of `node-fetch`.
A binary value is a `string | Buffer`. Use [typescript-fetch-client](../typescript-fetch-client)
instead for a client that uses the standard `fetch` types. That client also runs in a browser.

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
`fetch`. Supply one also to add a retry, a timeout or a request log. See
[Supplying your own `fetch`](#supplying-your-own-fetch).

## Using

See the [OpenAPI Generator Plus](https://github.com/karlvr/openapi-generator-plus) documentation for how to use
generator templates.

### Supplying your own `fetch`

Each generated API class takes a `fetch` function as its third constructor argument. The function
must match the generated `FetchAPI` type:

```ts
export type FetchAPI = (url: string, init?: RequestInit) => Promise<Response>;
```

```ts
import { PetApi, Configuration } from './generated-client'

const api = new PetApi(new Configuration({ /* ... */ }), undefined, myFetch)
```

The second argument is the base path. Pass `undefined` to keep the base path from the API
specification, or from the `Configuration`.

The generated factory function takes the same three arguments:

```ts
import { PetApiFactory } from './generated-client'

const api = PetApiFactory(configuration, undefined, myFetch)
```

The generated functional form takes the `fetch` function in the returned function. This suits a
request-scoped `fetch`, such as one that a server framework gives to a request handler:

```ts
import { PetApiFp } from './generated-client'

const pet = await PetApiFp(configuration).getPetById(petId)(myFetch)
```

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
> [typescript-fetch-client](../typescript-fetch-client) if you must supply a standard `fetch`.

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
|`legacyUnnamespacedModelSupport`|`boolean`|Generate unnamespaced versions of the models.|`false`|
|`withInterfaces`|`boolean`|Generate an interface for each API class, which the class implements.|`false`|
|`dateApproach`|`"native"\|"string"\|"blind-date"`|Whether to use `string` for date and time and `Date` for date-time, or just `string`, or whether to use [blind-date](https://npmjs.com/blind-date) for dates and times.|`native`|
|`esm`|`boolean`|Whether to output ESM-style code.|`false`|
|`apiNamespace`|`string`|The name of the TypeScript namespace used to export all models.|`"Api"`|

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

### Overrides

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`customTemplates`|`string`|The path to a directory containing custom Handlebars templates, relative to the config file. See Customising below.|`undefined`|

## Customising

This generator supports a `customTemplates` config file property to specify a directory containing Handlebars templates that will be used to override built-in templates.

Any custom template will have the original template available as a partial named by prefixing the template name with `original`, and then upper-casing the first letter, e.g. `originalModelEnum`.

Some of the templates in the generator are designed to support overriding for custom requirements. Please inspect the templates in the `templates` directory.
