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

The cases come in **suites**. A suite is one specification, one file of cases,
and one driver entry file per client family. `src/suites/index.ts` lists them.

| Suite | Spec | Cases | What it checks |
|---|---|---|---|
| `conformance` | `specs/conformance.yml` | `src/suites/conformance.ts` | parameters, bodies, responses, security |

1. A suite's specification holds one operation for each thing that the suite
   checks.
2. A suite's cases file holds the cases. A case names the calls that a driver
   makes, the response that the server sends, and what the suite expects.
3. A **driver** calls the operations. Each client family needs one, because each
   generated API looks different. A driver only makes calls. It reports what each
   call produced.
4. `src/server.ts` records every request against the case that the driver
   announced, and answers with that case's canned response.
5. The suite asserts on the recorded requests and on the driver's report.

Each suite generates its own client project. So a suite can hold whatever schemas
its cases need, and those schemas never reach another suite.

The server serves under a base path, `/api/v1`. A real server URL usually carries
a path, and a client must keep it in front of every operation path. A client that
drops the path still reaches this server, so the base path makes that mistake
visible.

The suite copies the driver into the generated project, so the project's own
compiler checks the driver against the generated types. A signature that a
caller cannot write then fails the build.

A family's drivers share a **harness**, which announces a case, makes a call and
writes the report. A TypeScript family keeps it in `drivers/<family>/harness.ts`.
A Java family keeps it in `drivers/<family>/ConformanceHarness.java`. The entry
file of each suite builds on the harness, so it holds only the calls.

## Running it

Build this package first. A generator package reads the driver sources and the
specification from this package's directory.

```
pnpm --filter @openapi-generator-plus/client-conformance build
pnpm --filter @openapi-generator-plus/typescript-fetch-client-generator test
```

The Java drivers need `mvn` and a JDK on the `PATH`.

## Adding a generator

Add a spec file in the generator package that runs every suite:

```ts
import { runConformanceTests } from '@openapi-generator-plus/client-conformance/dist/testing'
import { SUITES } from '@openapi-generator-plus/client-conformance/dist/suites'
import createGenerator from '..'
import { DEFAULT_CONFIG } from './common'

for (const suite of SUITES) {
	runConformanceTests({
		createGenerator,
		driver: 'fetch-client',
		config: DEFAULT_CONFIG,
		suite,
	})
}
```

A generator that shares an API shape with an existing driver needs nothing else.
A generator with a new shape needs a harness and one entry file per suite in
`drivers/<family>/`, and an entry in `DRIVERS` in `src/drivers.ts`.

## Adding a case

Add the operation to the suite's specification, add the case to the suite's
cases file, then add the calls to the suite's entry file in every driver family.
A driver matches a case by its id, so an id must not change once a driver knows
it. Each driver runs the cases in the order that the suite declares them, and
the suite checks that.

## Adding a suite

Give a new family of cases a suite of its own when the cases need schemas of
their own, or when they would swamp the list that they join. A suite is:

1. A specification in `specs/<id>.yml`.
2. A cases file in `src/suites/<id>.ts`, which exports a `ConformanceSuite`.
3. An entry in `SUITES` in `src/suites/index.ts`.
4. An entry file in each driver family: `drivers/<family>/<id>.ts` for a
   TypeScript family, or `drivers/<family>/<Id>Driver.java` for a Java family,
   where `<Id>` is the id in upper camel case.

The suite id names all of these, so keep it a plain lower-case word.

Give every case a `requests` list, with the method and the path of each request
that it expects. The suite checks those, so `expectRequests` only has to assert
on what a request carries. A path that carries a value takes a regular expression
instead, because each client may encode the value differently.

Give a case values that differ between its parameters. Each driver passes its
arguments by position, so two parameters that carry the same value hide a driver
that passes them in the wrong order.

A case that must tell a null response property apart from an absent one cannot
compare a serialised model. Each language holds the two differently, and neither
survives serialisation. Such a case has the driver report one word for each
property instead: `absent`, `null`, or the value as text. A case that reads a
response header reports the same way, because each client names a header in its
own way.

Give a case an assertion that every client can meet, or record the difference. A
case that asks for behaviour the spec leaves open states its reasoning in a
comment, so a reader can see which policy the case chose.

## Known defects

A case may carry `knownDefects`, which names the drivers that fail it and why.
The suite expects such a test to **fail**. So a known defect keeps the suite
green, and the suite reports as soon as someone fixes the generator. Remove the
entry with the fix.

A case may also carry `skipDrivers`, for a client that cannot express the case at
all. Use `skipDrivers` only for that, never to accept a defect.
