---
id: svc-factory-fns
when: writing a factory that returns services
paths:
  - 'packages/headless/src/modules/**/*.services.ts'
  - 'packages/headless/src/modules/**/*.services.*.ts'
---
# The services factory returns functions only

The services factory returns function references, plus the module's cache-key constant. It must not expose a flag, a derived value or a resolved id.

The test: every member of the returned object is a function or the key constant. A value that changes over time is state (mod-state-once). A yes/no value is meta. Put each one in its own layer (mod-layer-contents).
