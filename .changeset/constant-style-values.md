---
"@openapi-generator-plus/java-like-generator-helper": patch
"@openapi-generator-plus/generator-common": minor
---

Accept the documented values for the `constantStyle` and `enumMemberStyle` config options.

`constantStyle` accepted `snake` for the style that the documentation calls `allCapsSnake`.
`enumMemberStyle` accepted `contant` for the style that the documentation calls `constant`.
Both options now accept the documented value. Both options also continue to accept the earlier
value, which is deprecated.

An invalid value for either option now fails when the generator reads its config. The error message
lists the valid values.

Fixes [#70](https://github.com/karlvr/openapi-generator-plus-generators/issues/70)
