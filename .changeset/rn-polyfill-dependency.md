---
"@openapi-generator-plus/typescript-fetch-client-generator": minor
"@openapi-generator-plus/typescript-fetch-rn-client-generator": patch
---

Stop the React Native client importing a polyfill that it does not depend on.

The generated `runtime.ts` imported `whatwg-fetch`, because `includePolyfills` is on by
default. The React Native generator overrides the dependency list, and its override did not
carry the polyfill. So the generated project imported a package that its `package.json`
never named, and the import failed at run time.

React Native provides `fetch`, so `includePolyfills` now defaults to off for that
generator. A caller who turns it on gets the import and the dependency together, because
the override now builds on `defaultPackageDependencies` rather than replacing it.

`defaultPackageDependencies` is now exported. A child generator that overrides
`packageDependencies` should call it, and add its own lines to the result.
