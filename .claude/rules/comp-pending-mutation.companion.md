---
id: comp-pending-mutation
paths:
  - 'packages/headless/src/modules/**/use*.ts'
  - 'packages/headless/src/modules/**/*.services.ts'
  - 'packages/headless/src/modules/**/*.services.*.ts'
---
# Upmind binding

The meta layer (`use<Module>.meta.ts`) reads the mutation's `isPending`.

`isDownloading` in `legacy-invoices/useLegacyInvoice.ts` is a hand-set `ref`. It is a known breach. Do not copy it.
