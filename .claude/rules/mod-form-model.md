---
id: mod-form-model
when: a module edits and saves form values
paths:
  - 'packages/headless/src/modules/**/use*.ts'
  - 'packages/headless/src/modules/**/*.machine.ts'
---
# Form values live in the machine as model

Keep a module's form values in its machine context as `model`. A `SET` event updates `model`. A machine service saves it.

Do not hold form values in a `ref` in a layer, and do not mirror them in a second model object. For the `SET` handler in each form state, see xs-form-set.
