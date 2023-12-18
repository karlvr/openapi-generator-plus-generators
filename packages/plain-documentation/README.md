# Plain API documentation generator for OpenAPI Generator Plus

An [OpenAPI Generator Plus](https://github.com/karlvr/openapi-generator-plus) template for generating API documentation.

## Using

See the [OpenAPI Generator Plus](https://github.com/karlvr/openapi-generator-plus) documentation for how to use
generator templates.

For convenience when editing the API spec, or editing custom templates, you can setup a watch script and an automatically
reloading web browser:

```shell
npm add -D live-server
```

Then add the following `npm` script, adjusting paths to your config file and output folder (`./dist` in this example):

```json
{
	"scripts": {
        "watch": "openapi-generator-plus -c config.yml --clean --watch & live-server --port=9123 ./dist & wait"
    }
}
```

## Config file

The available config file properties are:

### Options

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`operations`|`Operations`|Configuration for operations|`undefined`|
|`customTemplates`|`string`|The path to a directory containing custom Handlebars templates, relative to the config file. See Customising below.|`undefined`|

### Operations

|Property|Type|Description|Default|
|--------|----|-----------|-------|
|`navStyle`|`"name" \| "full-path"`|The display style in the nav.|`"name"`|
|`exclude`|`string[]`|An array of regex strings to match against operation full-paths to exclude some operations.|`[]`

## Customising

This generator supports a `customTemplates` config file property to specify a directory containing Handlebars templates that will be used to override built-in templates.

Any custom template will have the original template available as a partial named by prefixing the template name with `original`, and then upper-casing the first letter, e.g. `originalBodyParams`.

Some of the templates in the generator are designed to support overriding for custom requirements. Please inspect the templates in the `templates` directory.
