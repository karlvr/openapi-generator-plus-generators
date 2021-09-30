# OpenAPI Generator Plus Generator Templates

A project containing generator templates and template helpers for [OpenAPI Generator Plus](https://github.com/karlvr/openapi-generator-plus)

## Building

This project uses [nvm](https://github.com/nvm-sh/nvm) for managing the versions of node, and [pnpm](https://pnpm.io) for installing packages and managing the monorepo project structure.

To setup `nvm`:

```shell
nvm install
nvm use
```

To install pnpm:

```shell
npm -g install pnpm
```

To install and build the project:

```
pnpm install
pnpm build
pnpm watch
```

To run the tests:

```shell
pnpm test
```

### Linking with OpenAPI Generator Plus Core

If you're making changes to core at the same time:

1. In the `openapi-generator-plus` workspace, execute `pnpm run link`, then `pnpm watch`
2. In this workspace, execute `pnpm run link`, then `pnpm watch`

## Templates

OpenAPI Generator Plus has its own object model for representing the API specification. Templates from other
generators must be rewritten or modified. This is usually not a complicated process as the
properties available to templates are well-defined by [TypeScript interfaces](https://github.com/karlvr/openapi-generator-plus/blob/master/packages/types/src/types.ts).

### Handlebars

OpenAPI Generator Plus uses [Handlebars](https://handlebarsjs.com) for templating. Handlebars builds on the functionality of the
[mustache](https://mustache.github.io) templates used in [swagger-codegen](https://github.com/swagger-api/swagger-codegen)
making templates more powerful and easier to customise. Handlebars also supports custom helpers to put more
capability into templates, such as case transformations.

The [handlebars-templates](./packages/handlebars-templates) package includes a number of helpers that are used throughout
the generator templates.
