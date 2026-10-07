---
id: xs-form-set
paths:
  - '**/*.machine.ts'
  - '**/*.machine.*.ts'
---
# Upmind binding

Exemplar: the `available` state in `packages/headless/src/modules/auth/auth.machine.ts:153-158`. Its `SET` handler runs `setModel` and enters `.checking` again.
