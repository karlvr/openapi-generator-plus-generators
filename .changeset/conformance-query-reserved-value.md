---
"@openapi-generator-plus/client-conformance": minor
---

Add the `query-reserved-value` case: a client must percent-encode a `+`, `&` or `=` in a query value

A query reads an unencoded `+` as a space, and an unencoded `&` or `=` splits the value into other
parameters. The case sends the new `QUERY_VALUE` export as a query value, and checks that the value
arrives unchanged.

A driver from another repository must add a call for this case, or name it in `skipCases`.
