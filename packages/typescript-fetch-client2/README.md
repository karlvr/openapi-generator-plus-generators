# Strongly-typed TypeScript Fetch Browser API generator for OpenAPI Generator Plus

An [OpenAPI Generator Plus](https://github.com/karlvr/openapi-generator-plus) template for a TypeScript API client using Fetch in a Browser
with support for multiple strongly-typed responses.

This template supersedes [typescript-fetch-client](../typescript-fetch-client). The generated code
is not backwards compatible with the code of the earlier template.

## Features

### Exports one function per operation

The generated client exports a standalone function for each operation, such as `getPetById(id)`.
Import only the function that you call. A bundler can then remove the rest. See
[Tree Shaking](#tree-shaking).

### Groups many parameters into an object

An operation with more than one parameter takes a single object. Each member of the object has a
name, so the order does not matter. A new parameter in the API specification does not move the other
arguments. See [Operation Parameters](#operation-parameters).

### Returns strongly-typed responses

Each operation resolves with a discriminated union on the `status` field. The compiler makes you
handle every response that the API specification documents. It also makes you handle an
undocumented response, and an error. The operation does not throw. See
[Error Handling](#error-handling).

### Accepts configuration at three levels

A `Configuration` holds the base URI, the `fetch` function and the authentication. Set a
configuration at one of three levels:

1. A default configuration for the whole client.
2. A configuration for one group of operations.
3. A configuration for a single call.

See [Configuring the Generated API Client](#configuring-the-generated-api-client).

### Accepts your own `fetch`

The generated client calls the `fetch` function from its `Configuration`. Supply your own
implementation for a request-scoped `fetch`. Supply one also to add a retry, a timeout or a request
log. See [Supplying your own `fetch`](#supplying-your-own-fetch).

### Puts the models in a namespace

The generated models use a TypeScript namespace. The `apiNamespace` config file property sets its
name. A nested model keeps the shape of the API specification.

### Represents dates and times in three ways

The `dateApproach` config file property sets how the generated client represents a date, a time and
a date-time. Use the native `Date`, use a `string`, or use the
[`blind-date`](https://npmjs.com/blind-date) library.

## Using

See the [OpenAPI Generator Plus](https://github.com/karlvr/openapi-generator-plus) documentation for how to use
generator templates.

### Operation Parameters

An operation with more than one parameter takes a single object as its first argument:

```ts
import { getCompetitions } from './generated-client/api/competitions'

const response = await getCompetitions({ limit: 20, areaId })
```

The generated client declares an interface for that object in the namespace of the operation group.
A member is optional if the API specification does not make the parameter required:

```ts
namespace CompetitionsApi {
	export interface GetCompetitionsParameters {
		areaId?: string
		sportId?: string
		limit: number
	}
}
```

Import the group to refer to the interface. Use `import type` to keep the group out of your
JavaScript bundle. See [Tree Shaking](#tree-shaking).

```ts
import type CompetitionsApi from './generated-client/api/competitions'

function makeParameters(areaId: string): CompetitionsApi.GetCompetitionsParameters {
	return { limit: 20, areaId }
}
```

An operation with one parameter takes that parameter directly, such as `getPetById(petId)`.

A request body is always a separate argument. It comes after the parameters:

```ts
const response = await createPet({ dryRun: true }, pet)
```

The optional `RequestInit` and `Configuration` arguments come last. See
[Configuring the Generated API Client](#configuring-the-generated-api-client).

### Configuring the Generated API Client

The generated API client has several options you can configure including the base URI, fetch 
function, and authentication information.

There are several different ways to change this configuration:
1. Using `setDefaultConfiguration(...)` allows you to change the default configuration used when no 
overriding configuration is provided.
2. `withConfiguration(...)` for either a specific endpoint group, or the entire API. The resulting API
client uses the provided configuration over the default, and can be useful when you need to override
the default configuration for specific groups of endpoints:
	```ts
	import { withConfiguration } from './generated-client/api/admin'

	const adminConfiguration = new Configuration({ apiKey: 'MY_ADMIN_API_KEY' })
	const adminApi = withConfiguration(adminConfiguration)

 	/* Uses adminConfiguration */
	const response = await adminApi.getDetails()
	```
	> [!NOTE]
	> This prevents the configured API/group from being tree shaken, which can result in unused 
	> endpoints being included in your built JS. Read more about this in the 
	> [Tree Shaking](#tree-shaking) section below.
3. Overriding configuration on a per-endpoint basis can be done by passing a configuration object as
the final parameter to an endpoint functions. This configuration is used instead of the default 
configuration.

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
[Configuring the Generated API Client](#configuring-the-generated-api-client) above.

A custom `fetch` can also add behaviour that the generated client does not provide. Add a retry, a
timeout or a request log:

```ts
import type { FetchAPI } from './generated-client'

const loggingFetch: FetchAPI = async (url, init) => {
	console.log(`${init?.method ?? 'GET'} ${url}`)
	return fetch(url, init)
}
```

### Error Handling

The generated endpoints enforce that your application can handle all errors returned by your 
API through 
[discriminated response types](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions) 
on the `status` field. In addition to the responses defined in your OpenAPI specification, there are
two other response types:

| `status`       | Meaning |
|----------------|---------|
| `'undocumented'` | The response contained an HTTP status code, or `Content-Type` not defined in your OpenAPI specification. |
| `'error'`        | An error was thrown in the generated endpoint. This could be due to a network error, a malformed response, a missing required parameter, etc. |

> [!TIP]
> We provide [type guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
> that can be used to differentiate between documented and unexpected responses:
> ```ts
> if (isDocumentedResponse(response)) {
> 	// This response is defined in your OpenAPI specification!	
> }
> if (isUnexpectedResponse(response)) {
>   // This response is either a `UndocumentedResponse` or `FetchErrorResponse`.	
> }
> ```

### Tree Shaking

If you're not using every endpoint in your API, 
[tree shaking](https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking) is a useful tool that
bundlers employ to remove unused code from the resulting JavaScript. For the best tree shaking when
using the generated API client, it is recommended to import the endpoints directly from their
respective files:

```ts
// All other endpoints in this file wont be included in the resulting bundle.
import { getDetails } from './generated-client/api/admin'
```

If you import the API group from the default import, from the index file, or `withConfiguration`
for a specific API group, then every endpoint in the group will be bundled into your JavaScript. 
Using the API-wide `withConfiguration` in the index file causes every endpoint to be bundled. 

```ts
// All of these will cause the entire admin group to be included in your bundle, even if you
// only use one endpoint. 
import { AdminApi } from './generated-client'
import AdminApi from './generated-client/api/admin'
import { withConfiguration } from './generated-client/api/admin'

// Configuring the entire api will cause every endpoint to be bundled into your JavaScript.
import { withConfiguration } from './generated-client'
```

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
|`includePolyfills`|`boolean`|Include polyfills for features that browsers might not support or support well. The `fetch` polyfill is [`whatwg-fetch`](https://npmjs.com/whatwg-fetch), and it replaces the global `fetch`. Set this to `false` if your environment already provides `fetch`.|`true`|
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

### Overrides

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`customTemplates`|`string`|The path to a directory containing custom Handlebars templates, relative to the config file. See Customising below.|`undefined`|

## Customising

This generator supports a `customTemplates` config file property to specify a directory containing Handlebars templates that will be used to override built-in templates.

Any custom template will have the original template available as a partial named by prefixing the template name with `original`, and then upper-casing the first letter, e.g. `originalModelEnum`.

Some of the templates in the generator are designed to support overriding for custom requirements. Please inspect the templates in the `templates` directory.
