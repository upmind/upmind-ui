---
id: docs-one-word-per-concept
paths:
  - '**/*.md'
  - 'packages/**/*.ts'
  - 'packages/**/*.vue'
---
# Upmind binding

- The glossary is `docs/corpus/glossary.yaml`. `docs/corpus/gates/gate-symbols.mjs` fails CI when a glossary referent no longer resolves.
- Example of one name: always `storeUrl`, never `storefront_url` for the same value. The mustache form is `@data.storeUrl` or `@data.*.storeUrl`.
