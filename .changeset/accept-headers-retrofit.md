---
"@openapi-generator-plus/java-retrofit-client-generator": minor
---

Send an `Accept` header for each operation. The header lists the media types of the operation's default response.

The generator does not filter that list by what the client can parse. Retrofit parses responses with a converter factory that you supply, so the generator cannot know which media types succeed.

Retrofit adds header parameters instead of replacing them. So the generator omits the header when the spec declares an `Accept` header parameter. The caller then controls the value. To set a default that a caller can override, add an OkHttp interceptor to your own `Retrofit` client.
