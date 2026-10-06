---
id: xs-parallel-states
paths:
  - 'packages/headless/src/modules/**/*.machine.ts'
  - 'packages/headless/src/modules/**/*.machine.*.ts'
---
# Upmind binding

Exemplar: `packages/headless/src/modules/basket/basket.machine.ts`. Its `shopping` state runs `products`, `promotions`, `billing`, `currency` and `paymentDetail` in parallel.

The same pattern is in `contract/contract.machine.ts`, `contract-product/contract-product.machine.ts`, `account/account.machine.ts` and `domain/domain.machine.ts`.
