# Client conformance

A shared test suite that runs a **generated** API client against a recording HTTP
server, then checks what the client put on the wire, and what it made of the
response.

This package is private. It is never published.

## Why

The other test suites generate a client and compile it. Compiling proves that
the code is valid. It does not prove that the client sends the right bytes.

This suite calls every operation for real. So it can show that a null form
property becomes `prop=`, that a path segment keeps its `@`, or that a client
parses a `204`.

## How it works

1. One OpenAPI specification, `specs/conformance.yml`, holds one operation for
   each thing that the suite checks.
2. `src/cases.ts` holds the cases. A case names the calls that a driver makes,
   the response that the server sends, and what the suite expects.
3. A **driver** calls the operations. Each client family needs one, because each
   generated API looks different. A driver only makes calls. It reports what each
   call produced.
4. `src/server.ts` records every request against the case that the driver
   announced, and answers with that case's canned response.
5. The suite asserts on the recorded requests and on the driver's report.

The suite copies the driver into the generated project, so the project's own
compiler checks the driver against the generated types. A signature that a
caller cannot write then fails the build.

## Running it

Build this package first. A generator package reads the driver sources and the
specification from this package's directory.

```
pnpm --filter @openapi-generator-plus/client-conformance build
pnpm --filter @openapi-generator-plus/typescript-fetch-client-generator test
```

The Java drivers need `mvn` and a JDK on the `PATH`.

## Adding a generator

Add a line to `src/__tests__`-style spec file in the generator package:

```ts
import { runConformanceTests } from '@openapi-generator-plus/client-conformance/dist/testing'
import createGenerator from '..'
import { DEFAULT_CONFIG } from './common'

runConformanceTests({
	createGenerator,
	driver: 'fetch-client',
	config: DEFAULT_CONFIG,
})
```

A generator that shares an API shape with an existing driver needs nothing else.
A generator with a new shape needs a driver in `drivers/`, and an entry in
`DRIVERS` in `src/drivers.ts`.

## Adding a case

Add the operation to `specs/conformance.yml`, add the case to `src/cases.ts`,
then add the calls to every driver. A driver matches a case by its id, so an id
must not change once a driver knows it.

## Known defects

A case may carry `knownDefects`, which names the drivers that fail it and why.
The suite expects such a test to **fail**. So a known defect keeps the suite
green, and the suite reports as soon as someone fixes the generator. Remove the
entry with the fix.

A case may also carry `skipDrivers`, for a client that cannot express the case at
all. Use `skipDrivers` only for that, never to accept a defect.
