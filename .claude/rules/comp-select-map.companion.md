---
id: comp-select-map
paths:
  - 'packages/headless/src/modules/**/use*.ts'
  - 'packages/headless/src/modules/**/*.services.ts'
  - 'packages/headless/src/modules/**/*.services.*.ts'
---
# Upmind binding

The context layer (`use<Module>.context.ts`) exposes the selected data as it is. Do not map it again there.

The query types are `ListQuery<TQueryFnData, TData>` and `MutationResult<TData, ...>` in `modules/query/query.types.ts`. Type a query handle with them.

The worked examples of the data-fetching variant are the auth and product-catalogue modules.
