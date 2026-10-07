---
id: xs-error-autoclear
paths:
  - '**/*.machine.ts'
  - '**/*.machine.*.ts'
---
# Upmind binding

Exemplar: `packages/headless/src/modules/auth/auth.machine.ts:160-162`. The `checking` state runs `clearError` on entry, so each `SET` clears the error.
