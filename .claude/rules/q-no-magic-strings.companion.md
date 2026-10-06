---
id: q-no-magic-strings
paths:
  - '**/*.ts'
  - '**/*.tsx'
  - '**/*.vue'
---
# Upmind monorepo bindings

The most frequent case here is the actor enum. Write `AccessRoleTypes.STAFF` from `@upmind-automation/types`, never `"staff"`.
