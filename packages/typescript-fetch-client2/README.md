# Strongly-typed TypeScript Fetch Browser API generator for OpenAPI Generator Plus

An [OpenAPI Generator Plus](https://github.com/karlvr/openapi-generator-plus) template for a TypeScript API client using Fetch in a Browser
with support for multiple strongly-typed responses.

This client generator supercedes the [typescript-fetch-client-generator](../typescript-fetch-client)

For an API client to use in Node applications, see [typescript-fetch-node-client-generator](../typescript-fetch-node-client).

## Using

See the [OpenAPI Generator Plus](https://github.com/karlvr/openapi-generator-plus) documentation for how to use
generator templates.

## Config file

The available config file properties are:

### Project layout

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`relativeSourceOutputPath`|`string`|The path to output generated source code, relative to the output path.|`./` or `./src` if `npm` is specified.|

### Code style

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`constantStyle`|`"allCapsSnake"\|"allCaps"\|"camelCase"\|"pascalCase"`|The style to use for constant naming.|`"pascalCase"`|
|`enumMemberStyle`|`"preserve"` \| `"constant"`|The style to use for enum member names: `preserve` _attempts_ to match the enum member name to the literal enum value from the spec; `constant` uses the `constantStyle` rules.|`"constant"`|
|`dateApproach`|`"native"\|"string"\|"blind-date"`|Whether to use `string` for date and time and `Date` for date-time, or just `string`, or whether to use [`blind-date`](https://npmjs.com/blind-date) for dates and times.|`native`|
|`legacyUnnamespacedModelSupport`|`boolean`|Generate unnamespaced versions of the models.|`false`|
|`includePolyfills`|`boolean`|Include polyfills for features that browsers might not support or support well.|`true`|

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
|`lib`|`string[]`|An array of `libs` to use in `tsconfig.json`|The appropriate lib for the `target` + `'DOM'`|

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
