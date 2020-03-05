# OpenAPI Generator + Generators

A project containing some generators for [OpenAPI Generator +](https://github.com/karlvr/openapi-generator-plus)

## Building

```
npx lerna bootstrap
npm run build
```

### Watch

```
npm run watch
```

### With core

If you're making changes to core at the same time:

1. In the `openapi-generator-plus/packages/core` folder, execute `npm link --ignore-scripts`
2. In this project, execute `npm link @openapi-generator-plus/core`
