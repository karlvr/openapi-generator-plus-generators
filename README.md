# OpenAPI Generator + Generators

A project containing some generators for [OpenAPI Generator +](https://github.com/karlvr/openapi-generator-plus)

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

### With core

If you're making changes to core at the same time:

1. In the `openapi-generator-plus` workspace, execute `pnpm run link`, then `pnpm watch`
2. In this workspace, execute `pnpm run link`, then `pnpm watch`
