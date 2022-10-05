---
"@openapi-generator-plus/typescript-fetch-client-generator2": minor
---

Rename automatically generated parameters interface from `EndpointRequest` to `EndpointParameters`

This is to better represent its purpose; to encapsulate endpoint _parameters_ and so as not to be
confused with the interfaces we might automatically name for a request body that currently end with
`Request`.

This does mean a migration for any existing code with endpoints that have more than one parameters.
I have treated this as a minor, rather than major, version bump due to the prerelease nature
of this generator template.
