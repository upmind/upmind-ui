---
id: comp-single-query
paths:
  - 'packages/headless/src/modules/**/use*.ts'
  - 'packages/headless/src/modules/**/*.services.ts'
  - 'packages/headless/src/modules/**/*.services.*.ts'
---
# Upmind binding

No composable layer (meta, context or actions) creates a second query for a question that the module's query already answers.

Here the wrapper does the combining. `query({ queries, select })` and `list({ queries, select })` take an array of entries (`url`, `init`, `queryKey`) in place of `url`, run them through TanStack's `useQueries`, and pass every entry's data and envelope to `select`, which is TanStack's `combine` (`modules/query/useQuery.ts`). `listInfinite()` takes one entry only, because TanStack has no infinite form of `useQueries`.
