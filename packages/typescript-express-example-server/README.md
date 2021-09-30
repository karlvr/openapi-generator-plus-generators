# TypeScript Express Example Server API generator for OpenAPI Generator Plus

An [OpenAPI Generator Plus](https://github.com/karlvr/openapi-generator-plus) template for a TypeScript API server using Express to serve example responses.

If you've added example responses in your OpenAPI spec then this server will output them in response to API requests. If you've specified
multiple requests it will randomly choose between them.

## Using

See the [OpenAPI Generator Plus](https://github.com/karlvr/openapi-generator-plus) documentation for how to use
generator templates.

Once the generator has been run, the generated package can be run using:

```shell
npm install
npm start
```

It will start an API server running on port 3000.

You may also specify a different port:

```shell
npm start -- -p 9000
```

## Config file

The available config file properties are:

### Project layout

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`relativeSourceOutputPath`|`string`|The path to output generated source code, relative to the output path.|`./` or `./src` if `npm` is specified.|

### TypeScript

A `tsconfig.json` file will be output if you specify any of the TypeScript config options.

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`typescript`|`TypeScriptConfig`|Configuration for the `tsconfig.json` file.|`undefined`|

#### `TypeScriptConfig`

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`target`|`string`|The ECMAScript target version.|`ES5`|

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
