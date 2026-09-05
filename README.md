# OpenAPI Generator Plus Generator Templates

A project containing generator templates and template helpers for [OpenAPI Generator Plus](https://github.com/karlvr/openapi-generator-plus)

## Available generator templates

### TypeScript

|Template|Runs in|Description|
|--------|-------|-----------|
|[typescript-fetch-client2](./packages/typescript-fetch-client2)|Browser|API client using Fetch. Generates a tree-shakeable function per operation, with strongly-typed responses.|
|[typescript-fetch-node-client2](./packages/typescript-fetch-node-client2)|Node|`typescript-fetch-client2`, using `node-fetch` and Node types.|
|[typescript-fetch-rn-client](./packages/typescript-fetch-rn-client)|React Native|`typescript-fetch-client`, with the polyfills React Native needs.|
|[typescript-express-example-server](./packages/typescript-express-example-server)|Node|An example Express server.|

Legacy templates not recommended for new projects:

|Template|Runs in|Description|
|--------|-------|-----------|
|[typescript-fetch-client](./packages/typescript-fetch-client)|Browser|An earlier version of `typescript-fetch-client2`. Generates an API class per operation group.|
|[typescript-fetch-node-client](./packages/typescript-fetch-node-client)|Node|An earlier version of `typescript-fetch-node-client2`.|

### Java

|Template|Description|
|--------|-----------|
|[java-cxf-cdi-server](./packages/java-cxf-cdi-server)|JAX-RS server using Apache CXF and CDI.|
|[java-cxf-spring-server](./packages/java-cxf-spring-server)|JAX-RS server using Apache CXF and Spring.|
|[java-cxf-client](./packages/java-cxf-client)|JAX-RS client using Apache CXF.|
|[java-jaxrs-client](./packages/java-jaxrs-client)|JAX-RS client.|
|[java-retrofit-client](./packages/java-retrofit-client)|Client using Retrofit.|

### Documentation

|Template|Description|
|--------|-----------|
|[plain-documentation](./packages/plain-documentation)|Plain text documentation of the API.|

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
