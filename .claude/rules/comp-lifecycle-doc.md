---
id: comp-lifecycle-doc
when: a composable creates a machine
paths:
  - 'packages/headless/src/modules/**/use*.ts'
---
# State if a composable is a singleton or an instance

Decide if a composable is a singleton or an instance. State the decision in the composable's JSDoc.

A singleton lives as long as the app. It interprets its machine at module scope and starts it on the first call. The singletons are brand, basket and session-store.

An instance lives for one use, such as a wizard. It interprets and starts its machine inside the composable, so each consumer gets a fresh one. The flow and wizard composables, such as auth and checkout, are instances. For the teardown side, see comp-destroy-vs-stop.
