---
"@openapi-generator-plus/typescript-fetch-client-generator": patch
"@openapi-generator-plus/typescript-fetch-client-generator2": patch
"@openapi-generator-plus/typescript-fetch-node-client-generator": patch
"@openapi-generator-plus/typescript-fetch-node-client-generator2": patch
"@openapi-generator-plus/typescript-fetch-rn-client-generator": patch
---

Percent encode a joined parameter value once, not twice.

A style that joins many values into one, such as a non-exploded array or object, a
`pipeDelimited` or a `spaceDelimited` parameter, ran each value through `escape` before
it joined them. The client then gave the joined value to `URLSearchParams` or to
`Headers`, which encoded the `%` of each escape again.

So a value with a space arrived as `a%20b`, and a date-time arrived as
`2020-01-02T03%3A04%3A05.678Z`. A server read the escape as text.

The client now joins the raw values. The destination encodes them, which it already did.
A header keeps its value as text, because a header carries no percent encoding.

`escape` also encodes a character outside Latin-1 as `%uXXXX`, which is not a percent
encoding at all. That form is gone too.

OpenAPI does not define how to escape a value that holds the delimiter itself. Such a
value stays ambiguous, as it was before.
