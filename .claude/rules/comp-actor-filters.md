---
id: comp-actor-filters
when: a scoped composable exposes list filters
paths:
  - 'packages/headless/src/modules/**/use*.ts'
---
# Filters live in the actor arm

Define filter state and filter methods in the actor-specific actions arm, `use<Module>.actions.<actor>.ts`. Each actor can support different filters.

Do not define filters in the main composable `use<Module>.ts` or in a shared layer factory.
