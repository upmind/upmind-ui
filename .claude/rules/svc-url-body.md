---
id: svc-url-body
when: writing a request in a services file
paths:
  - 'packages/headless/src/modules/**/*.services.ts'
  - 'packages/headless/src/modules/**/*.services.*.ts'
---
# Write the URL and the body in the request

Build a request's URL and body inside that request, with the `useQuery()` wrapper (`modules/query/useQuery.ts`). Do not write a function that only builds the URL or the body for one request. Do not wrap a synchronous check in a Promise.

Such a function hides nothing, so it is not an abstraction (q-abstraction).

```typescript
function loadInvoice(invoiceId: string) {
  const { get, useUrl } = useQuery();

  return get({ url: useUrl(`invoices/${invoiceId}`) });
}
```
