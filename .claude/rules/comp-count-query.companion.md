---
id: comp-count-query
paths:
  - 'packages/headless/src/modules/**/use*.ts'
  - 'packages/headless/src/modules/**/*.services.ts'
  - 'packages/headless/src/modules/**/*.services.*.ts'
---
# Upmind binding

The envelope type is `QueryResponse<T>`. `select(data, response)` receives it second (`modules/query/query.types.ts`, `QueryParams`).

`loadCount` in `product-catalogue` builds a fake list for its count. It is a known breach. Do not copy it.
